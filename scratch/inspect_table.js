const { initializeOracle, getConnection, closeOracle } = require('../src/config/oracle');

async function main() {
  await initializeOracle();
  const connection = await getConnection();

  try {
    console.log('Inspecting table FERNANDO.USUARIOS_TESTE...');
    const result = await connection.execute(
      `
        SELECT column_name, data_type, nullable, data_default
        FROM all_tab_columns
        WHERE table_name = 'USUARIOS_TESTE'
          AND owner = 'FERNANDO'
      `
    );
    console.log('Columns:');
    console.dir(result.rows, { depth: null });
  } catch (error) {
    console.error('Error inspecting table:', error);
  } finally {
    await connection.close();
    await closeOracle();
  }
}

main();
