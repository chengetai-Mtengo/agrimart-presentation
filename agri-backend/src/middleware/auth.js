const jwt = require('jsonwebtoken');
const { config } = require('../config/config');
const { AuthenticationError } = require('../utils/errors');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Unauthorized'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    return next();
  } catch (error) {
    return next(new AuthenticationError('Invalid token'));
  }
}

module.exports = { authenticate };
