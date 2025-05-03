const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/pending-creators', async (req, res) => {
  try {
    const [results] = await (await db).execute("SELECT * FROM creators WHERE status = 'pending'");
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching pending creators:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/approve/:id', async (req, res) => {
  const creatorId = req.params.id;

  try {
    const [result] = await (await db).execute("UPDATE creators SET status = 'approved' WHERE id = ?", [creatorId]);
    res.status(200).json({ message: 'Creator approved successfully' });
  } catch (err) {
    console.error('Error approving creator:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/reject/:id', async (req, res) => {
  const creatorId = req.params.id;

  try {
    const [result] = await (await db).execute("UPDATE creators SET status = 'rejected' WHERE id = ?", [creatorId]);
    res.status(200).json({ message: 'Creator rejected successfully' });
  } catch (err) {
    console.error('Error rejecting creator:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
