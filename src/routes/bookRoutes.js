const express = require('express');

const bookController = require('../controllers/bookController');

const router = express.Router();

router.get('/categories', bookController.getCategories);
router.get('/search', bookController.searchBook);
router.get('/:id', bookController.getBookById);
router.get('/', bookController.listBooks);

module.exports = router;
