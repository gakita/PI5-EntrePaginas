const express = require('express');

const authRoutes = require('./authRoutes');
const chatRoutes = require('./chatRoutes');
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

module.exports = router;
