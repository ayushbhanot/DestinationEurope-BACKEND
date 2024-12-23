const jwt = require('jsonwebtoken');

module.exports = async function (req, res, next) {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ msg: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.id, nickname: decoded.nickname };

    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.status(401).json({ msg: 'Invalid token. Access denied.' });
  }
};
