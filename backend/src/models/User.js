const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const USERS_TABLE = process.env.USERS_TABLE || 'signal_moi.users';

const User = {
    findAll: async () => {
        const res = await db.query(`SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active, created_at FROM ${USERS_TABLE} ORDER BY created_at DESC`);
        return res.rows;
    },
    
    findOne: async (options) => {
        if (options.where && options.where.email) {
            const res = await db.query(`SELECT * FROM ${USERS_TABLE} WHERE email = $1`, [options.where.email]);
            return res.rows[0] ? new UserInstance(res.rows[0]) : null;
        }
        return null;
    },
    
    findById: async (id) => {
        const res = await db.query(`SELECT * FROM ${USERS_TABLE} WHERE id = $1`, [id]);
        return res.rows[0] ? new UserInstance(res.rows[0]) : null;
    },
    
    create: async (userData) => {
        const { prenom, nom, email, telephone, password, ville, quartier, role, emailVerificationToken } = userData;
        
        // Hasher le mot de passe avant de l'enregistrer
        const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('Default123!', 10);
        
        const res = await db.query(
            `INSERT INTO ${USERS_TABLE} (prenom, nom, email, telephone, password, ville, quartier, role, email_verification_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, prenom, nom, email, role, is_active, email_verified`,
            [prenom, nom, email, telephone, hashedPassword, ville, quartier, role || 'citoyen', emailVerificationToken]
        );
        return new UserInstance(res.rows[0]);
    },
    
    update: async (id, updates) => {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map((f, idx) => `${f} = $${idx + 1}`).join(', ');
        const res = await db.query(
            `UPDATE ${USERS_TABLE} SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );
        return res.rows[0] ? new UserInstance(res.rows[0]) : null;
    },
    
    delete: async (id) => {
        await db.query(`DELETE FROM ${USERS_TABLE} WHERE id = $1`, [id]);
    },
    
    updateRole: async (id, role) => {
        const res = await db.query(`UPDATE ${USERS_TABLE} SET role = $1 WHERE id = $2 RETURNING id, role`, [role, id]);
        return res.rows[0];
    },
    
    resetPassword: async (id, newPassword = 'Default123!') => {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(`UPDATE ${USERS_TABLE} SET password = $1 WHERE id = $2`, [hashedPassword, id]);
    }
};

// Classe UserInstance pour les méthodes d'authentification
class UserInstance {
    constructor(data) {
        Object.assign(this, data);
        this.id = data.id;
        this.email = data.email;
        this.password = data.password;
        this.prenom = data.prenom;
        this.nom = data.nom;
        this.role = data.role;
        this.is_active = data.is_active;
        this.email_verified = data.email_verified;
    }
    
    // Valider le mot de passe
    async validatePassword(plainPassword) {
        try {
            if (!this.password) return false;
            return await bcrypt.compare(plainPassword, this.password);
        } catch (error) {
            console.error('Erreur validation mot de passe:', error);
            return false;
        }
    }
    
    // Générer JWT token
    generateAuthToken() {
        return jwt.sign(
            { 
                id: this.id, 
                email: this.email, 
                role: this.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
    }
    
    // Générer refresh token
    generateRefreshToken() {
        return jwt.sign(
            { id: this.id },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            { expiresIn: '7d' }
        );
    }
    
    // Sauvegarder les modifications
    async save() {
        const updates = {
            prenom: this.prenom,
            nom: this.nom,
            email: this.email,
            role: this.role,
            is_active: this.is_active,
            email_verified: this.email_verified,
            two_factor_enabled: this.two_factor_enabled,
            two_factor_secret: this.two_factor_secret,
            reset_password_token: this.reset_password_token,
            reset_password_expires: this.reset_password_expires,
            email_verification_token: this.email_verification_token,
            last_login: this.last_login
        };
        
        // Filtrer les undefined
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
        
        if (Object.keys(updates).length === 0) return this;
        
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map((f, idx) => `${f} = $${idx + 1}`).join(', ');
        
        const res = await db.query(
            `UPDATE ${USERS_TABLE} SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, this.id]
        );
        
        if (res.rows[0]) {
            Object.assign(this, res.rows[0]);
        }
        return this;
    }
    
    // Mettre à jour les champs
    async update(updates) {
        Object.assign(this, updates);
        return this.save();
    }
    
    // Conversion JSON
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}

module.exports = User;
