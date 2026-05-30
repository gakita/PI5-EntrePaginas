const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const env = require('../config/env');

const securityHeaders = helmet();

const globalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  securityHeaders,
  globalRateLimiter,
  authRateLimiter,
};
