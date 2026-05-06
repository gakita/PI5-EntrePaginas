const express = require('express');
const cors = require('cors');
const path = require('path');

const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get(env.chatbotPagePath, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'chatbot.html'));
});

app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
