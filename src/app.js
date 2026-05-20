const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// 🔒 Headers de segurança (Helmet)
app.use(helmet());

// 🔒 CORS restrito
const corsOptions = {
  origin: env.corsOrigin === '*' ? false : (env.corsOrigin || '').split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};
app.use(cors(corsOptions));

// 🔒 Rate limiting global (previne DoS)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições deste IP. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 🔒 JSON parsing com limite de tamanho
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get(env.chatbotPagePath, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'chatbot.html'));
});

app.get('/tester', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'tester.html'));
});

app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
