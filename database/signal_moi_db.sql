-- =====================================================
-- SIGNAL-MOI - BASE DE DONNÉES COMPLÈTE
-- Version: 1.0
-- =====================================================

-- Supprimer la base de données si elle existe
DROP DATABASE IF EXISTS signal_moi_db;

-- Créer la base de données
CREATE DATABASE signal_moi_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE signal_moi_db;

-- =====================================================
-- TABLE: users (Utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    prenom VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    quartier VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    lieu_naissance VARCHAR(100) NOT NULL,
    role ENUM('citoyen', 'police', 'collaborateur', 'admin') DEFAULT 'citoyen',
    is_active BOOLEAN DEFAULT TRUE,
    avatar VARCHAR(500),
    reset_password_token VARCHAR(255),
    reset_password_expires DATETIME,
    last_login DATETIME,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_ville (ville),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: signalements (Signalements citoyens)
-- =====================================================
CREATE TABLE IF NOT EXISTS signalements (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    titre VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('violence', 'vol', 'probleme_eclairage', 'nid_de_poule', 'incendie', 'accident', 'bruit', 'autre') NOT NULL,
    statut ENUM('nouveau', 'en_cours', 'traite', 'transfere', 'rejete') DEFAULT 'nouveau',
    priorite ENUM('basse', 'moyenne', 'haute', 'urgente') DEFAULT 'moyenne',
    localisation VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    adresse TEXT,
    est_anonyme BOOLEAN DEFAULT FALSE,
    assigned_to VARCHAR(36),
    transferred_from VARCHAR(36),
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_resolution DATETIME,
    commentaire_resolution TEXT,
    views_count INT DEFAULT 0,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_signalements_user (user_id),
    INDEX idx_signalements_statut (statut),
    INDEX idx_signalements_type (type),
    INDEX idx_signalements_assigned_to (assigned_to),
    INDEX idx_signalements_priorite (priorite),
    INDEX idx_signalements_date (date_signalement),
    INDEX idx_signalements_localisation (localisation(100)),
    FULLTEXT INDEX idx_signalements_search (titre, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: fichiers (Fichiers joints aux signalements)
-- =====================================================
CREATE TABLE IF NOT EXISTS fichiers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    signalement_id VARCHAR(36) NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin VARCHAR(500) NOT NULL,
    type ENUM('image', 'video', 'audio', 'document') NOT NULL,
    taille INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    uploaded_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (signalement_id) REFERENCES signalements(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_fichiers_signalement (signalement_id),
    INDEX idx_fichiers_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: campagnes (Campagnes de sensibilisation)
-- =====================================================
CREATE TABLE IF NOT EXISTS campagnes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    titre VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('formation', 'activite', 'sensibilisation', 'marche', 'conference', 'autre') NOT NULL,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    lieu VARCHAR(255) NOT NULL,
    adresse TEXT,
    capacite_max INT DEFAULT 100,
    prix DECIMAL(10, 2) DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    est_actif BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    banner_url VARCHAR(500),
    programme TEXT,
    prerequis TEXT,
    materiel TEXT,
    contact_organisateur VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_campagnes_date (date_debut, date_fin),
    INDEX idx_campagnes_type (type),
    INDEX idx_campagnes_est_actif (est_actif),
    INDEX idx_campagnes_lieu (lieu(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: inscriptions_campagnes (Inscriptions aux campagnes)
-- =====================================================
CREATE TABLE IF NOT EXISTS inscriptions_campagnes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    campagne_id VARCHAR(36) NOT NULL,
    statut ENUM('inscrit', 'present', 'absent', 'annule') DEFAULT 'inscrit',
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_presence DATETIME,
    code_qr VARCHAR(255),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campagne_id) REFERENCES campagnes(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_inscription (user_id, campagne_id),
    INDEX idx_inscriptions_user (user_id),
    INDEX idx_inscriptions_campagne (campagne_id),
    INDEX idx_inscriptions_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: messages (Messages entre utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    expediteur_id VARCHAR(36) NOT NULL,
    destinataire_id VARCHAR(36) NOT NULL,
    signalement_id VARCHAR(36),
    contenu TEXT NOT NULL,
    est_lu BOOLEAN DEFAULT FALSE,
    date_lecture DATETIME,
    pieces_jointes JSON,
    is_deleted_by_sender BOOLEAN DEFAULT FALSE,
    is_deleted_by_receiver BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destinataire_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (signalement_id) REFERENCES signalements(id) ON DELETE SET NULL,
    
    INDEX idx_messages_expediteur (expediteur_id),
    INDEX idx_messages_destinataire (destinataire_id),
    INDEX idx_messages_signalement (signalement_id),
    INDEX idx_messages_created_at (created_at),
    INDEX idx_messages_est_lu (est_lu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: notifications (Notifications utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type ENUM('signalement', 'message', 'statut', 'campagne', 'systeme') NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lien VARCHAR(500),
    reference_id VARCHAR(36),
    est_lu BOOLEAN DEFAULT FALSE,
    date_lecture DATETIME,
    est_envoyee BOOLEAN DEFAULT FALSE,
    sent_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_est_lu (est_lu),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: plaidoyers (Plaidoyers citoyens)
-- =====================================================
CREATE TABLE IF NOT EXISTS plaidoyers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    titre VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    contenu TEXT NOT NULL,
    auteur_id VARCHAR(36) NOT NULL,
    signatures INT DEFAULT 0,
    objectif_signatures INT NOT NULL,
    categorie ENUM('securite', 'environnement', 'education', 'sante', 'infrastructure', 'autre') NOT NULL,
    statut ENUM('en_cours', 'termine', 'archive') DEFAULT 'en_cours',
    date_limite DATETIME,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (auteur_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_plaidoyers_statut (statut),
    INDEX idx_plaidoyers_categorie (categorie),
    INDEX idx_plaidoyers_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: signatures_plaidoyers (Signatures des plaidoyers)
-- =====================================================
CREATE TABLE IF NOT EXISTS signatures_plaidoyers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    plaidoyer_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    commentaire TEXT,
    date_signature TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plaidoyer_id) REFERENCES plaidoyers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_signature (plaidoyer_id, user_id),
    INDEX idx_signatures_plaidoyer (plaidoyer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: historiques_signalements (Historique des changements)
-- =====================================================
CREATE TABLE IF NOT EXISTS historiques_signalements (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    signalement_id VARCHAR(36) NOT NULL,
    utilisateur_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) NOT NULL,
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (signalement_id) REFERENCES signalements(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_historiques_signalement (signalement_id),
    INDEX idx_historiques_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: logs_activite (Logs d'activité)
-- =====================================================
CREATE TABLE IF NOT EXISTS logs_activite (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_logs_utilisateur (utilisateur_id),
    INDEX idx_logs_action (action),
    INDEX idx_logs_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: sessions (Sessions utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(36),
    data TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PROCÉDURES STOCKÉES
-- =====================================================

DELIMITER //

-- Procédure: Compter les signalements par ville
CREATE PROCEDURE GetSignalementsByVille()
BEGIN
    SELECT 
        ville,
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'nouveau' THEN 1 ELSE 0 END) as nouveaux,
        SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as en_cours,
        SUM(CASE WHEN statut = 'traite' THEN 1 ELSE 0 END) as traites
    FROM signalements s
    JOIN users u ON s.user_id = u.id
    GROUP BY u.ville
    ORDER BY total DESC;
END //

-- Procédure: Statistiques par type d'incident
CREATE PROCEDURE GetStatsByType()
BEGIN
    SELECT 
        type,
        COUNT(*) as total,
        AVG(TIMESTAMPDIFF(HOUR, date_signalement, IFNULL(date_resolution, NOW()))) as temps_moyen_resolution
    FROM signalements
    GROUP BY type
    ORDER BY total DESC;
END //

-- Fonction: Calculer le temps de résolution moyen
CREATE FUNCTION GetAverageResolutionTime(type_incident VARCHAR(50))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE avg_time DECIMAL(10,2);
    
    SELECT AVG(TIMESTAMPDIFF(HOUR, date_signalement, date_resolution))
    INTO avg_time
    FROM signalements
    WHERE statut = 'traite'
    AND (type_incident IS NULL OR type = type_incident);
    
    RETURN IFNULL(avg_time, 0);
END //

DELIMITER ;

-- =====================================================
-- VUES
-- =====================================================

-- Vue: Signalements avec détails utilisateur
CREATE VIEW vue_signalements_complets AS
SELECT 
    s.*,
    u.prenom,
    u.nom,
    u.email,
    u.telephone,
    u.ville,
    u.quartier,
    GROUP_CONCAT(f.type) as types_fichiers
FROM signalements s
JOIN users u ON s.user_id = u.id
LEFT JOIN fichiers f ON s.id = f.signalement_id
GROUP BY s.id;

-- Vue: Statistiques quotidiennes
CREATE VIEW vue_stats_quotidiennes AS
SELECT 
    DATE(date_signalement) as date,
    COUNT(*) as total_signalements,
    COUNT(DISTINCT user_id) as signalants_uniques,
    SUM(CASE WHEN type = 'violence' THEN 1 ELSE 0 END) as violence,
    SUM(CASE WHEN type = 'vol' THEN 1 ELSE 0 END) as vol,
    SUM(CASE WHEN type = 'probleme_eclairage' THEN 1 ELSE 0 END) as eclairage,
    SUM(CASE WHEN type = 'nid_de_poule' THEN 1 ELSE 0 END) as nid_de_poule
FROM signalements
GROUP BY DATE(date_signalement)
ORDER BY date DESC;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger: Mettre à jour le compteur de signatures
CREATE TRIGGER update_signatures_count
AFTER INSERT ON signatures_plaidoyers
FOR EACH ROW
BEGIN
    UPDATE plaidoyers 
    SET signatures = signatures + 1
    WHERE id = NEW.plaidoyer_id;
END //

-- Trigger: Log des changements de statut
CREATE TRIGGER log_statut_change
AFTER UPDATE ON signalements
FOR EACH ROW
BEGIN
    IF OLD.statut != NEW.statut THEN
        INSERT INTO historiques_signalements (signalement_id, utilisateur_id, action, ancien_statut, nouveau_statut)
        VALUES (NEW.id, @current_user_id, 'changement_statut', OLD.statut, NEW.statut);
    END IF;
END //

-- Trigger: Mettre à jour last_login
CREATE TRIGGER update_last_login
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.last_login IS NOT NULL AND OLD.last_login IS NULL THEN
        INSERT INTO logs_activite (utilisateur_id, action, details)
        VALUES (NEW.id, 'login', JSON_OBJECT('timestamp', NOW()));
    END IF;
END //

DELIMITER ;

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Insertion d'un administrateur (Mot de passe: Admin123!)
INSERT INTO users (
    id, prenom, nom, email, telephone, password, ville, quartier, 
    date_naissance, lieu_naissance, role, email_verified
) VALUES (
    'admin-1', 'Admin', 'Système', 'admin@signal-moi.com', '0102030405',
    '$2b$10$rSqjKqPqQqQqQqQqQqQqOeXmXmXmXmXmXmXmXmXmXmXmXmXm',
    'Yaoundé', 'Centre', '1990-01-01', 'Yaoundé', 'admin', TRUE
);

-- Insertion d'un citoyen (Mot de passe: Test123!)
INSERT INTO users (
    id, prenom, nom, email, telephone, password, ville, quartier, 
    date_naissance, lieu_naissance, role, email_verified
) VALUES (
    'citoyen-1', 'Jean', 'Dupont', 'citoyen@test.com', '0612345678',
    '$2b$10$rSqjKqPqQqQqQqQqQqQqOeXmXmXmXmXmXmXmXmXmXmXmXmX',
    'Douala', 'Bonapriso', '1995-03-15', 'Douala', 'citoyen', TRUE
);

-- Insertion d'un policier (Mot de passe: Police123!)
INSERT INTO users (
    id, prenom, nom, email, telephone, password, ville, quartier, 
    date_naissance, lieu_naissance, role, email_verified
) VALUES (
    'police-1', 'Pierre', 'Martin', 'police@test.com', '0698765432',
    '$2b$10$sTtKtRtStTtTtTtTtTtUuVeXeXeXeXeXeXeXeXeXeXeXeXeX',
    'Yaoundé', 'Mvan', '1985-07-20', 'Yaoundé', 'police', TRUE
);

-- Insertion d'un collaborateur (Mot de passe: Collab123!)
INSERT INTO users (
    id, prenom, nom, email, telephone, password, ville, quartier, 
    date_naissance, lieu_naissance, role, email_verified
) VALUES (
    'collab-1', 'Marie', 'Camara', 'collab@test.com', '0678901234',
    '$2b$10$tUuVuWuXuYuZuVuWuXuYuZwAzAzAzAzAzAzAzAzAzAzAzA',
    'Douala', 'Akwa', '1992-11-10', 'Douala', 'collaborateur', TRUE
);

-- Insertion de signalements de test
INSERT INTO signalements (id, user_id, titre, description, type, statut, localisation, latitude, longitude, priorite) VALUES
('sig-1', 'citoyen-1', 'Nid-de-poule dangereux au carrefour', 
'Un nid-de-poule très profond qui a déjà causé plusieurs accidents de moto. Urgent de le réparer.',
'nid_de_poule', 'en_cours', 'Carrefour Bonapriso', 4.051056, 9.767869, 'haute'),

('sig-2', 'citoyen-1', 'Agression à la machette', 
'Vers 20h hier soir, un homme armé d\'une machette a agressé des passants et volé leurs affaires.',
'violence', 'nouveau', 'Quartier Akwa', 4.045456, 9.767869, 'urgente'),

('sig-3', 'citoyen-1', 'Vol de téléphone dans le marché', 
'Un pickpocket a volé mon téléphone pendant que je faisais mes courses. Il était vers les étals de légumes.',
'vol', 'traite', 'Marché Central', 4.041456, 9.778869, 'moyenne'),

('sig-4', 'citoyen-1', 'Lampadaires non fonctionnels', 
'Depuis 3 semaines, tous les lampadaires de la rue principale sont éteints. Très dangereux la nuit.',
'probleme_eclairage', 'transfere', 'Rue de la Libération', 4.048456, 9.770869, 'haute'),

('sig-5', 'citoyen-1', 'Incendie suspect', 
'Un feu s\'est déclaré dans un immeuble abandonné. Les pompiers sont intervenus mais la cause reste inconnue.',
'incendie', 'en_cours', 'Quartier Bonamoussadi', 4.061456, 9.725869, 'urgente');

-- Insertion de fichiers pour les signalements
INSERT INTO fichiers (id, signalement_id, nom_fichier, chemin, type, taille, mime_type) VALUES
('file-1', 'sig-1', 'nid-de-poule.jpg', '/uploads/signalements/sig-1/nid-de-poule.jpg', 'image', 2048576, 'image/jpeg'),
('file-2', 'sig-2', 'agression-video.mp4', '/uploads/signalements/sig-2/agression-video.mp4', 'video', 15728640, 'video/mp4');

-- Insertion de campagnes de test
INSERT INTO campagnes (id, titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by) VALUES
('camp-1', 'Formation sur la sécurité citoyenne', 
'Apprenez les gestes qui sauvent et comment vous protéger en cas d\'agression',
'formation', '2024-02-01 09:00:00', '2024-02-03 17:00:00', 'Salle polyvalente de Mvan', 50, 'admin-1'),

('camp-2', 'Marche contre l\'insécurité',
'Rassemblement citoyen pour demander plus de sécurité dans nos quartiers',
'marche', '2024-02-10 08:00:00', '2024-02-10 12:00:00', 'Place de l\'Indépendance', 1000, 'collab-1');

-- Insertion d'inscriptions aux campagnes
INSERT INTO inscriptions_campagnes (id, user_id, campagne_id, statut) VALUES
('ins-1', 'citoyen-1', 'camp-1', 'inscrit'),
('ins-2', 'police-1', 'camp-1', 'inscrit');

-- Insertion de messages
INSERT INTO messages (id, expediteur_id, destinataire_id, signalement_id, contenu) VALUES
('msg-1', 'citoyen-1', 'police-1', 'sig-1', 'Bonjour, j\'ai signalé ce nid-de-poule il y a une semaine. Quand sera-t-il réparé ?'),
('msg-2', 'police-1', 'citoyen-1', 'sig-1', 'Bonjour, l\'équipe technique a été informée. Les travaux commencent demain.');

-- Insertion de plaidoyers
INSERT INTO plaidoyers (id, titre, description, contenu, auteur_id, objectif_signatures, categorie) VALUES
('plaid-1', 'Pour plus d\'éclairage public', 
'Sécurisons nos quartiers avec un éclairage public adéquat',
'Nous demandons à la mairie d\'installer 100 nouveaux lampadaires dans les quartiers sensibles...',
'citoyen-1', 500, 'securite');

-- Insertion de signatures de plaidoyer
INSERT INTO signatures_plaidoyers (id, plaidoyer_id, user_id, commentaire) VALUES
('sign-1', 'plaid-1', 'citoyen-1', 'Totalement d\'accord, c\'est une urgence !'),
('sign-2', 'plaid-1', 'police-1', 'Je soutiens cette initiative');

-- =====================================================
-- CRÉATION DES UTILISATEURS ET PERMISSIONS MySQL
-- =====================================================

-- Créer un utilisateur spécifique pour l'application
DROP USER IF EXISTS 'signal_app'@'localhost';
CREATE USER 'signal_app'@'localhost' IDENTIFIED BY 'Signal2024Secure!';

-- Octroyer les privilèges nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON signal_moi_db.* TO 'signal_app'@'localhost';

-- Octroyer l'exécution des procédures
GRANT EXECUTE ON PROCEDURE signal_moi_db.GetSignalementsByVille TO 'signal_app'@'localhost';
GRANT EXECUTE ON PROCEDURE signal_moi_db.GetStatsByType TO 'signal_app'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- =====================================================
-- VÉRIFICATION DE L'INSTALLATION
-- =====================================================

SELECT '✅ Base de données créée avec succès !' as Status;
SELECT CONCAT('📊 Nombre d\'utilisateurs: ', COUNT(*)) as Info FROM users;
SELECT CONCAT('📋 Nombre de signalements: ', COUNT(*)) as Info FROM signalements;
SELECT CONCAT('📁 Nombre de fichiers: ', COUNT(*)) as Info FROM fichiers;
SELECT CONCAT('🎯 Nombre de campagnes: ', COUNT(*)) as Info FROM campagnes;
SELECT CONCAT('💬 Nombre de messages: ', COUNT(*)) as Info FROM messages;

-- Afficher la structure des tables
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND(DATA_LENGTH/1024/1024, 2) as 'Taille (MB)',
    ENGINE
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'signal_moi_db'
ORDER BY TABLE_NAME;

