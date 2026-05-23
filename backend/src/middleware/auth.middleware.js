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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ FIX: PostgreSQL syntax ($1) instead of MySQL (?)
    const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const users = result.rows || [];
    
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
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
