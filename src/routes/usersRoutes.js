const express = require('express');

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.delete('/me', authMiddleware, authController.deleteMe);

module.exports = router;
