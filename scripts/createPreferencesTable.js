/**
 * createPreferencesTable.js — Cria as tabelas de preferências e sugestões.
 *
 * Tabelas criadas:
 *   - PREFERENCIAS_USUARIO: guarda gêneros, tipos e autores favoritos por usuário
 *   - SUGESTOES_CONVERSA: acumula todos os livros/HQs/mangás sugeridos por conversa
 *
 * Como usar:
 *   npm run db:preferences
 */

const { initializeOracle, getConnection, closeOracle } = require('../src/config/oracle');

async function createTable(connection, sql, name) {
  try {
    await connection.execute(sql);
    console.log(`✓ ${name} criada.`);
  } catch (err) {
    if (err.errorNum === 955) {
      console.log(`- ${name} já existe. Nenhuma alteração.`);
    } else {
      throw err;
    }
  }
}

async function main() {
  await initializeOracle();
  const connection = await getConnection();

  console.log('Criando tabelas de preferências e sugestões...\n');

  try {
    // ── Tabela 1: PREFERENCIAS_USUARIO ──
    // Armazena as preferências de leitura de cada usuário (RIA01).
    // Atualizada a cada conversa encerrada com as preferências inferidas.
    await createTable(
      connection,
      `
        CREATE TABLE PREFERENCIAS_USUARIO (
            CODIGO            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            USUARIO_EMAIL     VARCHAR2(255) NOT NULL,
            GENEROS           CLOB,            -- JSON array: ["ficção científica", "fantasia"]
            TIPOS             CLOB,            -- JSON array: ["livro", "hq", "mangá"]
            AUTORES_FAVORITOS CLOB,            -- JSON array: ["Stephen King"]
            ATUALIZADO_EM     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      'PREFERENCIAS_USUARIO'
    );

    await createTable(
      connection,
      `CREATE UNIQUE INDEX IDX_PREF_USUARIO ON PREFERENCIAS_USUARIO(USUARIO_EMAIL)`,
      'Índice único PREFERENCIAS_USUARIO'
    );

    // ── Tabela 2: SUGESTOES_CONVERSA ──
    // Acumula todas as obras sugeridas pela IA ao usuário (RF13/RIA07).
    // Um registro por obra sugerida, com data/hora de quando foi sugerida.
    await createTable(
      connection,
      `
        CREATE TABLE SUGESTOES_CONVERSA (
            CODIGO          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            USUARIO_EMAIL   VARCHAR2(255) NOT NULL,
            TITULO          VARCHAR2(500) NOT NULL,
            TIPO            VARCHAR2(50),        -- livro, hq, mangá
            AUTOR           VARCHAR2(255),
            JUSTIFICATIVA   CLOB,
            TEMA_SENSIVEL   NUMBER(1) DEFAULT 0, -- 0 = não, 1 = sim
            CAPA_URL        VARCHAR2(1000),       -- URL da capa (enriquecimento)
            SINOPSE         CLOB,                -- Sinopse (enriquecimento)
            CRIADO_EM       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      'SUGESTOES_CONVERSA'
    );

    await createTable(
      connection,
      `CREATE INDEX IDX_SUG_USUARIO ON SUGESTOES_CONVERSA(USUARIO_EMAIL)`,
      'Índice SUGESTOES_CONVERSA'
    );

    await connection.commit();

    console.log('\nTudo pronto! Tabelas criadas com sucesso.');
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
