const express = require('express');

const authRoutes = require('./authRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

router.use('/auth', authRoutes);

module.exports = router;
