-- Seed data pour le développement
-- Date: 2024-01-15

USE signal_moi_db;

-- Vider les tables existantes (optionnel)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE signatures_plaidoyers;
TRUNCATE TABLE plaidoyers;
TRUNCATE TABLE inscriptions_campagnes;
TRUNCATE TABLE historiques_signalements;
TRUNCATE TABLE fichiers;
TRUNCATE TABLE messages;
TRUNCATE TABLE notifications;
TRUNCATE TABLE signalements;
TRUNCATE TABLE campagnes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Générer plus de données de test
DELIMITER //
CREATE PROCEDURE GenerateTestData()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE user_id VARCHAR(36);
    
    -- Générer 50 citoyens de test
    WHILE i <= 50 DO
        SET user_id = UUID();
        INSERT INTO users (id, prenom, nom, email, telephone, password, ville, quartier, date_naissance, lieu_naissance, role, email_verified)
        VALUES (
            user_id,
            CONCAT('Citoyen', i),
            CONCAT('Test', i),
            CONCAT('citoyen', i, '@test.com'),
            CONCAT('06', LPAD(i, 8, '0')),
            '$2b$10$rSqjKqPqQqQqQqQqQqQqOeXmXmXmXmXmXmXmXmXmXmXmXmX',
            ELT(1 + FLOOR(RAND() * 5), 'Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Maroua'),
            ELT(1 + FLOOR(RAND() * 10), 'Bonapriso', 'Mvan', 'Bastos', 'Akwa', 'Escale', 'Mokolo', 'Rond-point', 'Barriere', 'Makepe', 'Logbessou'),
            DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 50) YEAR),
            'Cameroun',
            'citoyen',
            TRUE
        );
        
        -- Générer des signalements pour chaque citoyen
        INSERT INTO signalements (id, user_id, titre, description, type, statut, localisation, priorite)
        VALUES (
            UUID(),
            user_id,
            CONCAT('Signalement de test #', i),
            CONCAT('Description du signalement ', i, ' - Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
            ELT(1 + FLOOR(RAND() * 7), 'violence', 'vol', 'probleme_eclairage', 'nid_de_poule', 'incendie', 'accident', 'bruit'),
            ELT(1 + FLOOR(RAND() * 5), 'nouveau', 'en_cours', 'traite', 'transfere', 'rejete'),
            CONCAT(ELT(1 + FLOOR(RAND() * 10), 'Quartier ', 'Rue ', 'Carrefour ', 'Marché ', 'École ', 'Hôpital ', 'Stade ', 'Gare ', 'Rond-point ', 'Pont '), i),
            ELT(1 + FLOOR(RAND() * 4), 'basse', 'moyenne', 'haute', 'urgente')
        );
        
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- Exécuter la procédure de génération
CALL GenerateTestData();

-- Nettoyer
DROP PROCEDURE IF EXISTS GenerateTestData;

SELECT '✅ Données de test générées avec succès!' as Status;
SELECT CONCAT('👥 Total utilisateurs: ', COUNT(*)) as Info FROM users;
SELECT CONCAT('📋 Total signalements: ', COUNT(*)) as Info FROM signalements;
