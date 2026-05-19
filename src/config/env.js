const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  chatbotPagePath: process.env.CHATBOT_PAGE_PATH || '/chatbot',
  oracleUser: process.env.ORACLE_USER,
  oraclePassword: process.env.ORACLE_PASSWORD,
  oracleConnectString: process.env.ORACLE_CONNECT_STRING,
  oracleConfigDir: process.env.ORACLE_CONFIG_DIR,
  oracleWalletLocation: process.env.ORACLE_WALLET_LOCATION,
  oracleWalletPassword: process.env.ORACLE_WALLET_PASSWORD,
  oraclePoolMin: Number(process.env.ORACLE_POOL_MIN || 1),
  oraclePoolMax: Number(process.env.ORACLE_POOL_MAX || 5),
  oraclePoolIncrement: Number(process.env.ORACLE_POOL_INCREMENT || 1),

  // ── Gemini (LLM) ──
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',

  // ── Google Books (enriquecimento de catálogo — opcional) ──
  googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || null,

  // ── Recuperacao de senha por e-mail ──
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER,
  smtpTimeoutMs: Number(process.env.SMTP_TIMEOUT_MS || 5000),
  passwordResetFrontendUrl: process.env.PASSWORD_RESET_FRONTEND_URL,
  passwordResetTokenMinutes: Number(process.env.PASSWORD_RESET_TOKEN_MINUTES || 30),
};
