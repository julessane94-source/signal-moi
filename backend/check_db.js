;(async () => {
  try {
    const db = require('./src/config/database');
    await db.authenticate();
    console.log('OK: DB connected');
    process.exit(0);
  } catch (e) {
    console.error('ERROR: DB connect failed', e.message || e);
    process.exit(1);
  }
})();
