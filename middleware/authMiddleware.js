const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization;

  if (token && token.startsWith('Bearer ')) {
    try {
      const actualToken = token.split(' ')[1];
      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

      req.user = { id: decoded.id }; 
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

module.exports = { protect };
