const jwt = require('jsonwebtoken');

const env = require('../config/env');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token nao informado.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token invalido ou expirado.',
    });
  }
}

module.exports = authMiddleware;
