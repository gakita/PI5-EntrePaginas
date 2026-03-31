const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  oracleUser: process.env.ORACLE_USER,
  oraclePassword: process.env.ORACLE_PASSWORD,
  oracleConnectString: process.env.ORACLE_CONNECT_STRING,
  oracleConfigDir: process.env.ORACLE_CONFIG_DIR,
  oracleWalletLocation: process.env.ORACLE_WALLET_LOCATION,
  oracleWalletPassword: process.env.ORACLE_WALLET_PASSWORD,
  oraclePoolMin: Number(process.env.ORACLE_POOL_MIN || 1),
  oraclePoolMax: Number(process.env.ORACLE_POOL_MAX || 5),
  oraclePoolIncrement: Number(process.env.ORACLE_POOL_INCREMENT || 1),
};
