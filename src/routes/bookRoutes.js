const express = require('express');

const bookController = require('../controllers/bookController');

const router = express.Router();

router.get('/search', bookController.searchBook);

module.exports = router;
