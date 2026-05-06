const express = require('express');

const authRoutes = require('./authRoutes');
const chatRoutes = require('./chatRoutes');
const quizRoutes = require('./quizRoutes');
const bookRoutes = require('./bookRoutes');
const usersRoutes = require('./usersRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

// Rotas de autenticação (cadastro, login, me)
router.use('/auth', authRoutes);

// Alias para operacoes da propria conta autenticada
router.use('/users', usersRoutes);

// Rotas do chat de recomendação com IA
router.use('/chat', chatRoutes);

// Rotas do quiz adaptativo de recomendação
router.use('/quiz', quizRoutes);

// Rotas simples de consulta ao catálogo Google Books
router.use('/books', bookRoutes);
module.exports = router;
