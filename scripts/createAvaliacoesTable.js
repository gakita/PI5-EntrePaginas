/**
 * createAvaliacoesTable.js — Cria a tabela de AVALIACOES
 *
 * Tabela criada:
 *   - AVALIACOES: armazena avaliações de usuários para livros
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

async function main() {
  await initializeOracle();
  const connection = await getConnection();

  console.log('Criando tabela de Avaliacoes...\n');

  try {
    // A tabela USUARIOS_TESTE e LIVROS (owner FERNANDO) já existem.
    // O usuário rodará isso conectado, geralmente com o schema padrão dele.
    
    await createTable(
      connection,
      `
        CREATE TABLE AVALIACOES (
            CODIGO        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            NOTA          INT NOT NULL,
            COMENTARIO    VARCHAR2(500),
            DT_AVALIACAO  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            COD_USUARIO   NUMBER NOT NULL,
            COD_LIVRO     NUMBER NOT NULL,
            CONSTRAINT FK_AVALIACAO_USUARIO FOREIGN KEY (COD_USUARIO) REFERENCES FERNANDO.USUARIOS_TESTE(CODIGO),
            CONSTRAINT FK_AVALIACAO_LIVRO FOREIGN KEY (COD_LIVRO) REFERENCES FERNANDO.LIVROS(CODIGO)
        )
      `,
      'AVALIACOES'
    );

    await connection.commit();
    console.log('\nTudo pronto! Tabela AVALIACOES criada com sucesso.');
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
