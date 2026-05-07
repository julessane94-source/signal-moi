const express = require('express');
const router = express.Router();

// UTILISATEURS EN MEMOIRE (temporaire pour test)
const users = [
  { id: "1", prenom: "Admin", nom: "System", email: "admin@signal-moi.com", password: "Admin123!", role: "admin", ville: "Yaounde", quartier: "Centre", telephone: "0102030405" },
  { id: "2", prenom: "Jean", nom: "Dupont", email: "citoyen@test.com", password: "Test123!", role: "citoyen", ville: "Douala", quartier: "Bonapriso", telephone: "0612345678" },
  { id: "3", prenom: "Pierre", nom: "Martin", email: "police@test.com", password: "Police123!", role: "police", ville: "Yaounde", quartier: "Mvan", telephone: "0698765432" },
  { id: "4", prenom: "Marie", nom: "Camara", email: "collab@test.com", password: "Collab123!", role: "collaborateur", ville: "Douala", quartier: "Akwa", telephone: "0678901234" }
];

router.post('/login', (req, res) => {
  console.log('Login:', req.body.email);
  console.log('Password:', req.body.password);
  
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    console.log('Utilisateur non trouve');
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }
  
  console.log('Utilisateur trouve:', user.email, 'Role:', user.role);
  
  const tokenData = { id: user.id, email: user.email, role: user.role };
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  
  const userResponse = {
    id: user.id,
    prenom: user.prenom,
    nom: user.nom,
    email: user.email,
    role: user.role,
    ville: user.ville,
    quartier: user.quartier,
    telephone: user.telephone
  };
  
  res.json({
    message: 'Connexion reussie',
    token: token,
    refreshToken: token + '_refresh',
    user: userResponse
  });
});

router.post('/register', (req, res) => {
  console.log('Register:', req.body.email);
  
  const newUser = {
    id: (users.length + 1).toString(),
    prenom: req.body.prenom,
    nom: req.body.nom,
    email: req.body.email,
    telephone: req.body.telephone,
    password: req.body.password,
    ville: req.body.ville,
    quartier: req.body.quartier,
    role: 'citoyen'
  };
  
  users.push(newUser);
  
  const token = Buffer.from(JSON.stringify({ id: newUser.id, email: newUser.email, role: newUser.role })).toString('base64');
  const { password, ...userData } = newUser;
  
  res.status(201).json({ message: 'Inscription reussie', token, user: userData });
});

router.get('/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('Profile request, auth:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Non authentifie' });
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    console.log('Decoded token:', decoded);
    
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouve' });
    }
    
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Token error:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Deconnexion reussie' });
});

module.exports = router;