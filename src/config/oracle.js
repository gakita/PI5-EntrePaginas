const oracledb = require('oracledb');

const env = require('./env');

let pool;

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = false;

function validateOracleEnv() {
  const requiredVars = [
    ['ORACLE_USER', env.oracleUser],
    ['ORACLE_PASSWORD', env.oraclePassword],
    ['ORACLE_CONNECT_STRING', env.oracleConnectString],
    ['ORACLE_CONFIG_DIR', env.oracleConfigDir],
  ].filter(([, value]) => !value);

  if (requiredVars.length > 0) {
    const missingVarNames = requiredVars.map(([name]) => name).join(', ');
    throw new Error(`Missing required Oracle environment variables: ${missingVarNames}`);
  }
}

function buildPoolConfig() {
  validateOracleEnv();

  const poolConfig = {
    user: env.oracleUser,
    password: env.oraclePassword,
    connectString: env.oracleConnectString,
    poolMin: env.oraclePoolMin,
    poolMax: env.oraclePoolMax,
    poolIncrement: env.oraclePoolIncrement,
  };

  if (env.oracleConfigDir) {
    poolConfig.configDir = env.oracleConfigDir;
  }

  if (env.oracleWalletLocation || env.oracleConfigDir) {
    poolConfig.walletLocation = env.oracleWalletLocation || env.oracleConfigDir;
  }

  if (env.oracleWalletPassword) {
    poolConfig.walletPassword = env.oracleWalletPassword;
  }

  return poolConfig;
}

async function initializeOracle() {
  if (pool) {
    return pool;
  }

  pool = await oracledb.createPool(buildPoolConfig());
  return pool;
}

async function getConnection() {
  if (!pool) {
    await initializeOracle();
  }

  return oracledb.getConnection();
}

async function closeOracle() {
  if (!pool) {
    return;
  }

  await pool.close(0);
  pool = null;
}

module.exports = {
  initializeOracle,
  getConnection,
  closeOracle,
};
