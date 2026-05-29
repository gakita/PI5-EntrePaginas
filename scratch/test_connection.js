const oracledb = require('oracledb');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const configDir = path.resolve(process.env.ORACLE_CONFIG_DIR || './secrets/oracle-wallet/Wallet_ProjetoIntegradorV');
  const walletLocation = path.resolve(process.env.ORACLE_WALLET_LOCATION || './secrets/oracle-wallet/Wallet_ProjetoIntegradorV');

  console.log('Resolved paths:');
  console.log(`configDir: ${configDir}`);
  console.log(`walletLocation: ${walletLocation}`);

  const connConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    configDir,
    walletLocation,
  };

  if (process.env.ORACLE_WALLET_PASSWORD) {
    connConfig.walletPassword = process.env.ORACLE_WALLET_PASSWORD;
  }

  let connection;
  try {
    console.log('Connecting to Oracle Database...');
    connection = await oracledb.getConnection(connConfig);
    console.log('Successfully connected to the database!');
    
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('Query result:', result.rows);
  } catch (error) {
    console.error('Connection failed with error:', error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

main();
