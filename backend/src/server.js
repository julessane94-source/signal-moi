require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const campagneRoutes = require('./routes/campagne.routes');
const signalementRoutes = require('./routes/signalement.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/signalements', signalementRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend fonctionne' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});