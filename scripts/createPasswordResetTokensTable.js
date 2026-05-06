/**
 * Cria a tabela de tokens de recuperacao de senha.
 *
 * Como usar:
 *   npm run db:password-reset
 */

const { initializeOracle, getConnection, closeOracle } = require('../src/config/oracle');

async function createObject(connection, sql, name) {
  try {
    await connection.execute(sql);
    console.log(`✓ ${name} criado.`);
  } catch (err) {
    if (err.errorNum === 955) {
      console.log(`- ${name} ja existe. Nenhuma alteracao.`);
    } else {
      throw err;
    }
  }
}

async function main() {
  await initializeOracle();
  const connection = await getConnection();

  console.log('Criando tabela de recuperacao de senha...\n');

  try {
    await createObject(
      connection,
      `
        CREATE TABLE PASSWORD_RESET_TOKENS (
          CODIGO      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          EMAIL       VARCHAR2(255) NOT NULL,
          TOKEN_HASH  VARCHAR2(64) NOT NULL,
          EXPIRES_AT  TIMESTAMP NOT NULL,
          USED_AT     TIMESTAMP NULL,
          CREATED_AT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `,
      'PASSWORD_RESET_TOKENS'
    );

    await createObject(
      connection,
      `CREATE UNIQUE INDEX IDX_PWD_RESET_TOKEN_HASH ON PASSWORD_RESET_TOKENS(TOKEN_HASH)`,
      'Indice IDX_PWD_RESET_TOKEN_HASH'
    );

    await createObject(
      connection,
      `CREATE INDEX IDX_PWD_RESET_EMAIL ON PASSWORD_RESET_TOKENS(EMAIL)`,
      'Indice IDX_PWD_RESET_EMAIL'
    );

    await connection.commit();

    console.log('\nTudo pronto! Tabela criada com sucesso.');
  } finally {
    await connection.close();
    await closeOracle();
  }
}

main().catch(async (err) => {
  console.error('Erro:', err.message);
  await closeOracle();
  process.exit(1);
});
