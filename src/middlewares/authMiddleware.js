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
    if (!token) {
      return res.status(401).json({ message: 'Token ausente.' });
    }

    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256']
    });

    if (!decoded.sub) {
      return res.status(401).json({ message: 'Token invalido.' });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    return res.status(401).json({
      message: 'Token invalido.',
    });
  }
}

module.exports = authMiddleware;
