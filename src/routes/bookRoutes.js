const express = require('express');
const rateLimit = require('express-rate-limit');

const bookController = require('../controllers/bookController');

const router = express.Router();

// 🔒 Rate limiter para endpoints públicos (50 req/15min por IP)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Muitas requisições. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/categories', publicLimiter, bookController.getCategories);
router.get('/search', publicLimiter, bookController.searchBook);
router.get('/', publicLimiter, bookController.listBooks);

module.exports = router;
