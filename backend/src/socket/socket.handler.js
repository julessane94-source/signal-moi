const jwt = require('jsonwebtoken');
const { User, Message, Signalement } = require('../models');
const logger = require('../utils/logger');
const { dispatchLiveToStation } = require('../utils/policeDispatch');
const { activeLiveSessions } = require('../utils/liveSessions');

// Les fragments restent en memoire seulement pendant la duree du direct :
// ils permettent a un commissariat qui vient de se connecter de recuperer la
// video deja diffusee et d'enregistrer la sequence complete.
const MAX_REPLAY_VIDEO_CHUNKS = 180;
const withoutVideoChunks = (session = {}) => {
  const { videoChunks, ...payload } = session;
  return payload;
};

const setupSocket = (io) => {
  const normalizeRole = (role) => String(role || '').trim().toLowerCase();
  const isPoliceRole = (role) => ['commissariat', 'police', 'policier', 'gendarmerie', 'force_ordre'].includes(normalizeRole(role));
  const isCommissariatRole = (role) => normalizeRole(role) === 'commissariat';
  const isCitizenRole = (role) => normalizeRole(role) === 'citoyen';
  const isCollaborateurRole = (role) => ['collaborateur', 'collaborator'].includes(normalizeRole(role));
  const isAdminRole = (role) => ['admin', 'administrateur'].includes(normalizeRole(role));

  // Middleware d'authentification pour les sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      const isActive = user?.isActive !== undefined ? user.isActive : user?.is_active !== false;
      if (!user || isActive === false) {
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
        if (isCommissariatRole(socket.user.role)) socket.join('commissariat_room');
        activeLiveSessions.forEach((payload) => {
          const recipientIds = Array.isArray(payload.assignedRecipientIds) ? payload.assignedRecipientIds.map(String) : [];
          const isAssignedAgent = recipientIds.includes(String(socket.user.id));
          if (!isCommissariatRole(socket.user.role) && !isAssignedAgent) return;
          const sessionPayload = withoutVideoChunks(payload);
          socket.emit('live_recording_started', sessionPayload);
          if (payload.latitude || payload.longitude || payload.localisation) {
            socket.emit('live_recording_location', sessionPayload);
          }
          if (payload.frame) {
            socket.emit('live_recording_frame', sessionPayload);
          }
          (payload.videoChunks || []).forEach((chunk) => {
            socket.emit('live_recording_chunk', { ...sessionPayload, ...chunk });
          });
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
        io.to('commissariat_room').emit('signalement_received', {
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

    socket.on('live_recording_started', async (data) => {
      try {
        if (!isCitizenRole(socket.user.role)) return;
        const payload = {
          ...data,
          citizenId: socket.user.id,
          citizenName: `${socket.user.prenom || ''} ${socket.user.nom || ''}`.trim(),
          startedAt: new Date()
        };
        const dispatchedPayload = await dispatchLiveToStation(io, payload, 'live_recording_started');
        if (payload.sessionId) activeLiveSessions.set(payload.sessionId, dispatchedPayload || payload);
        io.to('admin_room').emit('live_recording_started', payload);
        if (dispatchedPayload) {
          const notification = { ...dispatchedPayload, title: payload.titre || `Enregistrement en direct: ${payload.type || 'urgence'}`, message: 'Un citoyen est en train de filmer une preuve en direct.', isLiveRecording: true };
          (dispatchedPayload.assignedRecipientIds || []).forEach((recipientId) => io.to(`user_${recipientId}`).emit('new_signalement_notification', notification));
        }
      } catch (error) {
        logger.error('Erreur live_recording_started:', error);
      }
    });

    socket.on('live_recording_location', async (data) => {
      try {
        if (!isCitizenRole(socket.user.role)) return;
        const payload = {
          ...data,
          citizenId: socket.user.id,
          updatedAt: new Date()
        };
        const existing = activeLiveSessions.get(payload.sessionId) || {};
        const nextPayload = { ...existing, ...payload, status: 'recording' };
        if (payload.sessionId) {
          activeLiveSessions.set(payload.sessionId, nextPayload);
        }
        const dispatchedPayload = await dispatchLiveToStation(io, nextPayload, 'live_recording_location');
        if (payload.sessionId && dispatchedPayload) activeLiveSessions.set(payload.sessionId, dispatchedPayload);
      } catch (error) {
        logger.error('Erreur live_recording_location:', error);
      }
    });

    socket.on('live_recording_frame', async (data) => {
      try {
        if (!isCitizenRole(socket.user.role)) return;
        const payload = {
          ...data,
          citizenId: socket.user.id,
          frameAt: new Date()
        };
        const existing = activeLiveSessions.get(payload.sessionId) || {};
        const nextPayload = { ...existing, ...payload, status: 'recording' };
        if (payload.sessionId) {
          activeLiveSessions.set(payload.sessionId, nextPayload);
        }
        const dispatchedPayload = await dispatchLiveToStation(io, nextPayload, 'live_recording_frame');
        if (payload.sessionId && dispatchedPayload) activeLiveSessions.set(payload.sessionId, dispatchedPayload);
      } catch (error) {
        logger.error('Erreur live_recording_frame:', error);
      }
    });

    socket.on('live_recording_chunk', (data) => {
      try {
        if (!isCitizenRole(socket.user.role)) return;
        const payload = {
          ...data,
          citizenId: socket.user.id,
          chunkAt: new Date()
        };
        const existing = activeLiveSessions.get(payload.sessionId) || {};
        if (!payload.sessionId || !existing.sessionId) return;
        const videoChunk = {
          chunk: payload.chunk,
          sequence: Number(payload.sequence) || 0,
          mimeType: payload.mimeType || 'video/webm',
          durationMs: Number(payload.durationMs) || 2000,
          chunkAt: payload.chunkAt
        };
        const videoChunks = [...(existing.videoChunks || []), videoChunk]
          .slice(-MAX_REPLAY_VIDEO_CHUNKS);
        const nextSession = {
          ...existing,
          videoChunks,
          videoChunkCount: videoChunks.length,
          videoMimeType: videoChunk.mimeType,
          updatedAt: payload.chunkAt
        };
        activeLiveSessions.set(payload.sessionId, nextSession);
        const outboundPayload = { ...withoutVideoChunks(nextSession), ...videoChunk };
        const recipientIds = nextSession.assignedRecipientIds || [];
        recipientIds.forEach((recipientId) => io.to(`user_${recipientId}`).emit('live_recording_chunk', outboundPayload));
        io.to('commissariat_room').emit('live_recording_chunk', outboundPayload);
        io.to('admin_room').emit('live_recording_chunk', payload);
      } catch (error) {
        logger.error('Erreur live_recording_chunk:', error);
      }
    });

    socket.on('live_recording_stopped', async (data) => {
      try {
        if (!isCitizenRole(socket.user.role)) return;
        const payload = {
          ...data,
          citizenId: socket.user.id,
          stoppedAt: new Date()
        };
        const existing = activeLiveSessions.get(payload.sessionId) || {};
        const dispatchedPayload = await dispatchLiveToStation(io, { ...existing, ...payload }, 'live_recording_stopped');
        if (payload.sessionId) activeLiveSessions.delete(payload.sessionId);
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
        io.to(`user_${data.destinataireId}`).emit('message_received', {
          ...messageData,
          titre: 'Nouveau message',
          message: `Message de ${messageData.expediteurNom}`
        });
        
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
