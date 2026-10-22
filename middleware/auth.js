const jwt = require('jsonwebtoken');
const User = require('../models/User');

function auth(allowedRoles = []) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) return res.status(401).json({ error: 'Account not found. Sign in again.' });
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'This action is not available for your role.' });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
    }
  };
}

module.exports = auth;
