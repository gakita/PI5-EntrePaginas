const express = require('express');

const authMiddleware = require('../middlewares/authMiddleware');
const favoriteController = require('../controllers/favoriteController');

const router = express.Router();

router.get('/', authMiddleware, favoriteController.listFavorites);
router.post('/', authMiddleware, favoriteController.addFavorite);
router.delete('/:id', authMiddleware, favoriteController.removeFavorite);

module.exports = router;
