const { initializeOracle, getConnection, closeOracle } = require('../src/config/oracle');

async function createObject(connection, sql, name) {
  try {
    await connection.execute(sql);
    console.log(`[ok] ${name} criado.`);
  } catch (err) {
    if (err.errorNum === 955) {
      console.log(`- ${name} ja existe. Nenhuma alteracao.`);
      return;
    }
    throw err;
  }
}

async function main() {
  await initializeOracle();
  const connection = await getConnection();

  console.log('Criando tabela de sessoes do quiz...\n');

  try {
    await createObject(
      connection,
      `
        CREATE TABLE QUIZ_SESSOES (
          CODIGO        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          SESSION_ID    VARCHAR2(64) NOT NULL,
          USUARIO_EMAIL VARCHAR2(255) NOT NULL,
          MAX_PERGUNTAS NUMBER DEFAULT 8 NOT NULL,
          PERGUNTAS     CLOB,
          RESPOSTAS     CLOB,
          FINALIZADO    NUMBER(1) DEFAULT 0 NOT NULL,
          CRIADO_EM     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ATUALIZADO_EM TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      'QUIZ_SESSOES'
    );

    await createObject(
      connection,
      `CREATE UNIQUE INDEX IDX_QUIZ_USUARIO ON QUIZ_SESSOES(USUARIO_EMAIL)`,
      'Indice unico QUIZ_SESSOES por usuario'
    );

    await createObject(
      connection,
      `CREATE INDEX IDX_QUIZ_SESSION ON QUIZ_SESSOES(SESSION_ID)`,
      'Indice QUIZ_SESSOES por sessao'
    );

    await connection.commit();
    console.log('\nTudo pronto! Tabela de quiz criada com sucesso.');
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
