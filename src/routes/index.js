const express = require('express');

const authRoutes = require('./authRoutes');
const chatRoutes = require('./chatRoutes');
const quizRoutes = require('./quizRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

// Rotas de autenticação (cadastro, login, me)
router.use('/auth', authRoutes);

// Rotas do chat de recomendação com IA
router.use('/chat', chatRoutes);

// Rotas do quiz adaptativo de recomendação
router.use('/quiz', quizRoutes);

module.exports = router;
