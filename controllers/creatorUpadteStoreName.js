const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

router.post('/creator/update-name', protect, async (req, res) => {
  const token = req.headers.authorization;
  const newName = req.body.name;
  const cost = 5; 

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const creatorId = decoded.id; 

    const [coinsRows] = await db.execute(
      'SELECT tokens FROM creators WHERE id = ?',
      [creatorId]
    );

    if (coinsRows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const currentCoins = coinsRows[0].tokens;

    if (currentCoins < cost) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    await db.execute(
      'UPDATE creators SET store_name = ?, tokens = ? WHERE id = ?',
      [newName, currentCoins - cost, creatorId]
    );

    res.status(200).json({ message: 'Name updated successfully', newName: newName, remainingCoins: currentCoins - cost });

  } catch (error) {
    console.error('Error updating name:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;