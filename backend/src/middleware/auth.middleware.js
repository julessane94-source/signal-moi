const jwt = require('jsonwebtoken');
const db = require('../config/database');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token manquant'
    });
  }
  
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ FIX: PostgreSQL syntax ($1) instead of MySQL (?)
    const result = await db.query('SELECT * FROM signal_moi.users WHERE id = $1', [decoded.id]);
    const users = result.rows || [];
    
    if (!users || users.length === 0 || users[0].is_active === false) {
      return res.status(401).json({
        success: false,
        message: 'Compte utilisateur indisponible'
      });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.name, error.message);
    if (error.stack) console.error(error.stack.split('\n').slice(0,3).join('\n'));
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rôle ${req.user.role} non autorisé pour cette action`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
