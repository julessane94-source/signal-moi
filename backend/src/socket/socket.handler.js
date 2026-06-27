const jwt = require('jsonwebtoken');
const { User, Message, Signalement } = require('../models');
const logger = require('../utils/logger');

const setupSocket = (io) => {
  const activeLiveRecordings = new Map();
  const normalizeRole = (role) => String(role || '').trim().toLowerCase();
  const isPoliceRole = (role) => ['police', 'policier', 'gendarmerie', 'force_ordre'].includes(normalizeRole(role));
  const isCollaborateurRole = (role) => ['collaborateur', 'collaborator'].includes(normalizeRole(role));
  const isAdminRole = (role) => ['admin', 'administrateur'].includes(normalizeRole(role));

  // Middleware d'authentification pour les sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      // Allow a local test bypass token when explicitly enabled
      if (token === 'LOCAL_TEST_TOKEN' && process.env.ALLOW_SOCKET_BYPASS === 'true') {
        socket.user = {
          id: 'local-test',
          email: 'local@local.test',
          role: 'admin',
          prenom: 'Local',
          nom: 'Test'
        };
        return next();
      }

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    logger.info(`Socket connecté: ${socket.user.email} (${socket.user.role})`);
    
    // Rejoindre la room personnelle
    socket.join(`user_${socket.user.id}`);
    
    // Rejoindre les rooms par rôle
    if (isPoliceRole(socket.user.role)) {
      socket.join('police_room');
      activeLiveRecordings.forEach((payload) => {
        socket.emit('live_recording_started', payload);
        if (payload.latitude || payload.longitude || payload.localisation) {
          socket.emit('live_recording_location', payload);
        }
        if (payload.frame) {
          socket.emit('live_recording_frame', payload);
        }
      });
    } else if (isCollaborateurRole(socket.user.role)) {
      socket.join('collaborateur_room');
    } else if (isAdminRole(socket.user.role)) {
      socket.join('admin_room');
    }
    
    // Nouveau signalement
    socket.on('new_signalement', async (data) => {
      try {
        // Émettre aux autorités
        io.to('police_room').emit('signalement_received', {
          id: data.id,
          title: data.titre,
          type: data.type,
          timestamp: new Date()
        });
        
        // Notifier l'admin
        io.to('admin_room').emit('new_signalement_notification', data);
      } catch (error) {
        logger.error('Erreur new_signalement:', error);
      }
    });

    socket.on('live_recording_started', (data) => {
      try {
        const payload = {
          ...data,
          citizenId: socket.user.id,
          citizenName: `${socket.user.prenom || ''} ${socket.user.nom || ''}`.trim(),
          startedAt: new Date()
        };
        if (payload.sessionId) {
          activeLiveRecordings.set(payload.sessionId, payload);
        }
        io.to('police_room').emit('live_recording_started', payload);
        io.to('admin_room').emit('live_recording_started', payload);
        io.to('police_room').emit('new_signalement_notification', {
          ...payload,
          title: payload.titre || `Enregistrement en direct: ${payload.type || 'urgence'}`,
          message: 'Un citoyen est en train de filmer une preuve en direct.',
          isLiveRecording: true
        });
      } catch (error) {
        logger.error('Erreur live_recording_started:', error);
      }
    });

    socket.on('live_recording_location', (data) => {
      try {
        const payload = {
          ...data,
          citizenId: socket.user.id,
          updatedAt: new Date()
        };
        if (payload.sessionId) {
          activeLiveRecordings.set(payload.sessionId, {
            ...(activeLiveRecordings.get(payload.sessionId) || {}),
            ...payload,
            status: 'recording'
          });
        }
        io.to('police_room').emit('live_recording_location', payload);
      } catch (error) {
        logger.error('Erreur live_recording_location:', error);
      }
    });

    socket.on('live_recording_frame', (data) => {
      try {
        const payload = {
          ...data,
          citizenId: socket.user.id,
          frameAt: new Date()
        };
        if (payload.sessionId) {
          activeLiveRecordings.set(payload.sessionId, {
            ...(activeLiveRecordings.get(payload.sessionId) || {}),
            ...payload,
            status: 'recording'
          });
        }
        io.to('police_room').emit('live_recording_frame', payload);
      } catch (error) {
        logger.error('Erreur live_recording_frame:', error);
      }
    });

    socket.on('live_recording_stopped', (data) => {
      try {
        const payload = {
          ...data,
          citizenId: socket.user.id,
          stoppedAt: new Date()
        };
        if (payload.sessionId) {
          activeLiveRecordings.delete(payload.sessionId);
        }
        io.to('police_room').emit('live_recording_stopped', payload);
      } catch (error) {
        logger.error('Erreur live_recording_stopped:', error);
      }
    });
    
    // Envoyer un message
    socket.on('send_message', async (data) => {
      try {
        const message = await Message.create({
          expediteurId: socket.user.id,
          destinataireId: data.destinataireId,
          signalementId: data.signalementId || null,
          contenu: data.contenu
        });
        
        const messageData = {
          id: message.id,
          expediteurId: message.expediteurId,
          expediteurNom: `${socket.user.prenom} ${socket.user.nom}`,
          destinataireId: message.destinataireId,
          contenu: message.contenu,
          createdAt: message.createdAt
        };
        
        // Émettre au destinataire
        io.to(`user_${data.destinataireId}`).emit('new_message', messageData);
        
        // Confirmation à l'expéditeur
        socket.emit('message_sent', messageData);
      } catch (error) {
        logger.error('Erreur send_message:', error);
        socket.emit('message_error', { error: 'Erreur lors de l\'envoi' });
      }
    });
    
    // Marquer un message comme lu
    socket.on('mark_message_read', async (messageId) => {
      try {
        await Message.update(
          { estLu: true, dateLecture: new Date() },
          { where: { id: messageId, destinataireId: socket.user.id } }
        );
        
        io.to(`user_${socket.user.id}`).emit('message_read', { messageId });
      } catch (error) {
        logger.error('Erreur mark_message_read:', error);
      }
    });
    
    // Mise à jour de statut de signalement
    socket.on('update_signalement_status', async (data) => {
      try {
        const signalement = await Signalement.findByPk(data.signalementId);
        
        if (signalement) {
          // Notifier l'auteur du signalement
          io.to(`user_${signalement.userId}`).emit('status_updated', {
            signalementId: data.signalementId,
            nouveauStatut: data.nouveauStatut,
            commentaire: data.commentaire
          });
        }
      } catch (error) {
        logger.error('Erreur update_signalement_status:', error);
      }
    });
    
    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`user_${data.destinataireId}`).emit('user_typing', {
        expediteurId: socket.user.id,
        expediteurNom: `${socket.user.prenom} ${socket.user.nom}`
      });
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
      logger.info(`Socket déconnecté: ${socket.user.email}`);
    });
  });
};

module.exports = { setupSocket };
