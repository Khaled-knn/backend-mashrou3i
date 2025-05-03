const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/userAuthMiddleware');
const db = require('../config/db');   

router.post(
  '/register/user',
  [
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').isMobilePhone('any')
  ],
  authController.register
);

router.post(
  '/login/user',
  [
    body('email').isEmail().withMessage('بريد إلكتروني غير صالح'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
  ],
  authController.login
);

router.get('/profile/user', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const [rows] = await db.query(
        'SELECT id, first_name, last_name, email, phone , points , is_verified FROM users WHERE id = ?',
        [userId]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'المستخدم غير موجود' });
      }
        res.json({
        message: `مرحبا ${rows[0].email}`,
        user: rows[0]
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
module.exports = router;
