// Source unique des directs actifs, partagée par les routes HTTP et Socket.IO.
// Cela évite qu'un live reçu par un canal soit invisible sur l'autre.
const activeLiveSessions = new Map();

module.exports = { activeLiveSessions };
