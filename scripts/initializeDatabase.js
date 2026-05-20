/**
 * initializeDatabase.js — Script para criar todas as tabelas do banco de dados de uma vez.
 * 
 * Este script executa sequencialmente todos os scripts de criação de tabelas:
 * - CONVERSAS (chat)
 * - PREFERENCIAS_USUARIO e SUGESTOES_CONVERSA (preferências)
 * - QUIZ_SESSOES (quiz)
 * - PASSWORD_RESET_TOKENS (recuperação de senha)
 * - AVALIACOES (avaliações)
 * 
 * Como usar:
 *   npm run db:init
 * 
 * Ou diretamente:
 *   node scripts/initializeDatabase.js
 */

const { initializeOracle, getConnection, closeOracle } = require('../src/config/oracle');

async function createTable(connection, sql, name) {
  try {
    await connection.execute(sql);
    console.log(`✓ ${name} criada com sucesso.`);
  } catch (err) {
    if (err.errorNum === 955) {
      console.log(`- ${name} já existe. Nenhuma alteração.`);
    } else {
      console.error(`ERRO ao criar ${name}:`, err.message);
      throw err;
    }
  }
}

async function initializeDatabase() {
  console.log('========================================');
  console.log('Inicializando banco de dados...');
  console.log('========================================\n');

  try {
    await initializeOracle();
    const connection = await getConnection();

    // ── Tabela 1: CONVERSAS (Chat) ──
    console.log('1. Criando tabela CONVERSAS...');
    await createTable(
      connection,
      `
        CREATE TABLE CONVERSAS (
            CODIGO         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            USUARIO_EMAIL  VARCHAR2(255) NOT NULL,
            MENSAGENS      CLOB NOT NULL,
            CRIADO_EM      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ATUALIZADO_EM  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      'CONVERSAS'
    );

    await createTable(
      connection,
      `
        CREATE UNIQUE INDEX IDX_CONV_USUARIO
            ON CONVERSAS(USUARIO_EMAIL)
      `,
      'Índice IDX_CONV_USUARIO'
    );
    console.log('');

    // ── Tabela 2: PREFERENCIAS_USUARIO ──
    console.log('2. Criando tabela PREFERENCIAS_USUARIO...');
    await createTable(
      connection,
      `
        CREATE TABLE PREFERENCIAS_USUARIO (
            CODIGO            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            USUARIO_EMAIL     VARCHAR2(255) NOT NULL,
            GENEROS           CLOB,
            TIPOS             CLOB,
            AUTORES_FAVORITOS CLOB,
            ATUALIZADO_EM     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      'PREFERENCIAS_USUARIO'
    );

    await createTable(
      connection,
      `
        CREATE UNIQUE INDEX IDX_PREF_USUARIO
            ON PREFERENCIAS_USUARIO(USUARIO_EMAIL)
      `,
      'Índice IDX_PREF_USUARIO'
    );
    console.log('');

    // ── Tabela 3: SUGESTOES_CONVERSA ──
    console.log('3. Criando tabela SUGESTOES_CONVERSA...');
    await createTable(
      connection,
      `
        CREATE TABLE SUGESTOES_CONVERSA (
            CODIGO            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            USUARIO_EMAIL     VARCHAR2(255) NOT NULL,
            TITULO            VARCHAR2(500) NOT NULL,
            TIPO              VARCHAR2(50),
            AUTOR             VARCHAR2(255),
            GENEROS           CLOB,
            DATA_SUGESTAO     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      'SUGESTOES_CONVERSA'
    );

    await createTable(
      connection,
      `
        CREATE INDEX IDX_SUGE_USUARIO
            ON SUGESTOES_CONVERSA(USUARIO_EMAIL)
      `,
      'Índice IDX_SUGE_USUARIO'
    );
    console.log('');

    // ── Tabela 4: QUIZ_SESSOES ──
    console.log('4. Criando tabela QUIZ_SESSOES...');
    await createTable(
      connection,
      `
        CREATE TABLE QUIZ_SESSOES (
            CODIGO        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            USUARIO_EMAIL VARCHAR2(255) NOT NULL,
            RESPOSTAS     CLOB NOT NULL,
            RESULTADO     CLOB,
            CRIADO_EM     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      'QUIZ_SESSOES'
    );

    await createTable(
      connection,
      `
        CREATE INDEX IDX_QUIZ_USUARIO
            ON QUIZ_SESSOES(USUARIO_EMAIL)
      `,
      'Índice IDX_QUIZ_USUARIO'
    );
    console.log('');

    // ── Tabela 5: PASSWORD_RESET_TOKENS ──
    console.log('5. Criando tabela PASSWORD_RESET_TOKENS...');
    await createTable(
      connection,
      `
        CREATE TABLE PASSWORD_RESET_TOKENS (
            CODIGO        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            USUARIO_EMAIL VARCHAR2(255) NOT NULL,
            TOKEN_HASH    VARCHAR2(64) NOT NULL,
            CRIADO_EM     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            EXPIRA_EM     TIMESTAMP NOT NULL
        )
      `,
      'PASSWORD_RESET_TOKENS'
    );

    await createTable(
      connection,
      `
        CREATE INDEX IDX_RESET_USUARIO
            ON PASSWORD_RESET_TOKENS(USUARIO_EMAIL)
      `,
      'Índice IDX_RESET_USUARIO'
    );

    await createTable(
      connection,
      `
        CREATE UNIQUE INDEX IDX_RESET_TOKEN
            ON PASSWORD_RESET_TOKENS(TOKEN_HASH)
      `,
      'Índice IDX_RESET_TOKEN'
    );
    console.log('');

    // ── Tabela 6: AVALIACOES ──
    console.log('6. Criando tabela AVALIACOES...');
    await createTable(
      connection,
      `
        CREATE TABLE AVALIACOES (
            CODIGO            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            USUARIO_EMAIL     VARCHAR2(255) NOT NULL,
            LIVRO_TITULO      VARCHAR2(500) NOT NULL,
            LIVRO_AUTOR       VARCHAR2(255),
            LIVRO_ID_GOOGLE   VARCHAR2(50),
            RATING            NUMBER(1,0),
            COMENTARIO        CLOB,
            DATA_CRIACAO      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            DATA_ATUALIZACAO  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      'AVALIACOES'
    );

    await createTable(
      connection,
      `
        CREATE INDEX IDX_AVAL_USUARIO
            ON AVALIACOES(USUARIO_EMAIL)
      `,
      'Índice IDX_AVAL_USUARIO'
    );

    await createTable(
      connection,
      `
        CREATE INDEX IDX_AVAL_LIVRO
            ON AVALIACOES(LIVRO_TITULO, LIVRO_AUTOR)
      `,
      'Índice IDX_AVAL_LIVRO'
    );
    console.log('');

    // Fechar conexão
    await connection.close();

    console.log('========================================');
    console.log('Banco de dados inicializado com sucesso!');
    console.log('========================================\n');
    console.log('Tabelas criadas:');
    console.log('  ✓ CONVERSAS');
    console.log('  ✓ PREFERENCIAS_USUARIO');
    console.log('  ✓ SUGESTOES_CONVERSA');
    console.log('  ✓ QUIZ_SESSOES');
    console.log('  ✓ PASSWORD_RESET_TOKENS');
    console.log('  ✓ AVALIACOES');
    console.log('');

  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
    process.exit(1);
  } finally {
    await closeOracle();
  }
}

initializeDatabase();
