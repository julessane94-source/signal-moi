// Ajoutez cette route avant les autres
router.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as now');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
