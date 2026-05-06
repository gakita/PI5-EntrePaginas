const oracle = require('../src/config/oracle');

async function listUsers() {
  let connection;
  try {
    connection = await oracle.getConnection();
    const result = await connection.execute('SELECT CODIGO, NOME, EMAIL FROM FERNANDO.USUARIOS_TESTE');
    console.log('Users in database:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error listing users:', err.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

listUsers();
