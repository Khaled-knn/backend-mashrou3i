const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');



exports.register = async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;

  if (!first_name || !last_name || !email || !password || !phone) {
    return res.status(400).json({ message: 'الرجاء ملء جميع الحقول' });
  }

  try {
    const [emailCheck] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (emailCheck.length > 0) {
      return res.status(400).json({ message: 'البريد الإلكتروني مسجل مسبقًا' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      first_name,
      last_name,
      email,
      password: hashedPassword,
      phone
    };

    const [insertResult] = await db.query('INSERT INTO users SET ?', [user]);
    const payload = { id: insertResult.insertId, email };
  const token = jwt.sign(
   payload,
    process.env.JWT_SECRET,  
    { expiresIn: '7d' }          
  );

res.status(201).json({
  message: 'تم التسجيل بنجاح',
  userId: insertResult.insertId,
  token
});
  } catch (error) {
    console.error('حدث خطأ:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }


  
};


exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'المستخدم غير موجود' });
    }
    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });
    }

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}