const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

const validateRegisterData = (data) => {
  const schema = Joi.object({
    profession_id: Joi.number().integer().required(),
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    store_name: Joi.string().min(5).max(100).required(),
    password: Joi.string().min(8).pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+]{8,}$')).required(),
  });
  return schema.validate(data);
};

router.post('/register', async (req, res) => {
  const { profession_id, first_name, last_name, email, phone, store_name, password } = req.body;

  const { error } = validateRegisterData(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM creators WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

  
    const [result] = await db.execute(`
      INSERT INTO creators (profession_id, first_name, last_name, email, phone, store_name, password, tokens)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [profession_id, first_name, last_name, email, phone, store_name, hashedPassword, 0]
    );


    const token = jwt.sign(
      { id: result.insertId, email, role: 'creator' },  
      process.env.JWT_SECRET,
      { expiresIn: '7d' }    
    );

    return res.status(201).json({
      message: 'Creator registered successfully',
      creatorId: result.insertId,
      token: token,  
    });

  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


router.post('/creator/update-name', protect, async (req, res) => {
  const creatorId = req.userId;
  const newName = req.body.name;
  const cost = 5;

  try {
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
