/**
 * createAvaliacoesTable.js — Cria a tabela de AVALIACOES
 *
 * Tabela criada:
 *   - AVALIACOES: armazena avaliações de usuários para itens do Google Books
 *
 * Como usar:
 *   node scripts/createAvaliacoesTable.js
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

async function listColumns(connection, tableName) {
  const result = await connection.execute(
    `
      SELECT COLUMN_NAME
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = :tableName
    `,
    { tableName }
  );

  return new Set((result.rows || []).map((row) => row.COLUMN_NAME));
}

async function addColumnIfMissing(connection, columns, definition, label) {
  const [name] = definition.trim().split(/\s+/);

  if (columns.has(name)) {
    return false;
  }

  await connection.execute(`ALTER TABLE AVALIACOES ADD (${definition})`);
  console.log(`+ Coluna ${label} adicionada.`);
  columns.add(name);
  return true;
}

async function main() {
  await initializeOracle();
  const connection = await getConnection();

  console.log('Criando tabela de Avaliacoes...\n');

  try {
    // A tabela USUARIOS_TESTE (owner FERNANDO) já existe.
    // O usuário rodará isso conectado, geralmente com o schema padrão dele.

    await createTable(
      connection,
      `
        CREATE TABLE AVALIACOES (
            CODIGO           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            GOOGLE_BOOKS_ID  VARCHAR2(100) NOT NULL,
            TITULO           VARCHAR2(500) NOT NULL,
            NOTA             INT NOT NULL,
            COMENTARIO       VARCHAR2(500),
            DT_AVALIACAO     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            COD_USUARIO      NUMBER NOT NULL,
            CONSTRAINT FK_AVALIACAO_USUARIO FOREIGN KEY (COD_USUARIO) REFERENCES FERNANDO.USUARIOS_TESTE(CODIGO)
        )
      `,
      'AVALIACOES'
    );

    const columns = await listColumns(connection, 'AVALIACOES');

    await addColumnIfMissing(
      connection,
      columns,
      'GOOGLE_BOOKS_ID VARCHAR2(100)',
      'GOOGLE_BOOKS_ID'
    );

    await addColumnIfMissing(
      connection,
      columns,
      'TITULO VARCHAR2(500)',
      'TITULO'
    );

    if (columns.has('COD_LIVRO') && columns.has('TITULO')) {
      await connection.execute('ALTER TABLE AVALIACOES MODIFY (COD_LIVRO NULL)');
      console.log('+ Coluna COD_LIVRO alterada para NULLABLE.');

      await connection.execute(
        `
          UPDATE AVALIACOES A
          SET TITULO = (
            SELECT L.TITULO
            FROM FERNANDO.LIVROS L
            WHERE L.CODIGO = A.COD_LIVRO
          )
          WHERE A.TITULO IS NULL
            AND A.COD_LIVRO IS NOT NULL
        `
      );
      console.log('+ Backfill de TITULO executado a partir de COD_LIVRO.');
    }

    await connection.commit();
    console.log('\nTudo pronto! Tabela AVALIACOES pronta para uso com Google Books.');
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
