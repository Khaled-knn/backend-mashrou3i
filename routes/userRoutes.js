const express = require('express');
const { registerUser, loginUser, updateProfileImage, updatePoints } = require('../controllers/userController');
const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.put('/update-profile', updateProfileImage);

router.put('/update-points', updatePoints);

module.exports = router;
