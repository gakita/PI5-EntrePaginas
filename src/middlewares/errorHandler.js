const env = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  const isProduction = env.nodeEnv === 'production';

  return res.status(500).json({
    message: isProduction ? 'Erro interno do servidor.' : err.message,
    error: isProduction ? undefined : err.stack,
  });
}

module.exports = errorHandler;
