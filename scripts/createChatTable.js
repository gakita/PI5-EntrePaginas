/**
 * createChatTable.js — Script para criar a tabela CONVERSAS no Oracle.
 *
 * Este script conecta no banco Oracle (usando as mesmas configs do .env)
 * e executa o CREATE TABLE + CREATE INDEX.
 *
 * Se a tabela já existir, ele exibe um aviso e não dá erro.
 *
 * Como usar:
 *   npm run db:chat
 *
 * Ou diretamente:
 *   node scripts/createChatTable.js
 */

const { initializeOracle, getConnection, closeOracle } = require('../src/config/oracle');

async function createChatTable() {
  // Conecta no Oracle usando a mesma config do servidor
  await initializeOracle();
  const connection = await getConnection();

  try {
    // ── Passo 1: Criar a tabela CONVERSAS ──
    // A tabela guarda 1 conversa por usuário (RF12).
    // MENSAGENS é CLOB porque o JSON pode ficar grande
    // conforme a conversa cresce.
    console.log('Criando tabela CONVERSAS...');

    await connection.execute(`
      CREATE TABLE CONVERSAS (
          CODIGO         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          USUARIO_EMAIL  VARCHAR2(255) NOT NULL,
          MENSAGENS      CLOB NOT NULL,
          CRIADO_EM      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ATUALIZADO_EM  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tabela CONVERSAS criada com sucesso!');

    // ── Passo 2: Criar o índice UNIQUE ──
    // Garante que cada usuário tenha no máximo 1 conversa.
    // Se tentarmos inserir uma segunda conversa para o mesmo
    // email, o Oracle vai dar erro — por isso usamos MERGE no model.
    console.log('Criando indice unico IDX_CONV_USUARIO...');

    await connection.execute(`
      CREATE UNIQUE INDEX IDX_CONV_USUARIO
          ON CONVERSAS(USUARIO_EMAIL)
    `);

    console.log('Indice criado com sucesso!');

    // Commit para confirmar as alterações de DDL
    await connection.commit();

    console.log('\nTudo pronto! A tabela CONVERSAS esta criada e pronta para uso.');
  } catch (error) {
    // ORA-00955 = "name is already used by an existing object"
    // Isso significa que a tabela/índice já existe — não é um erro fatal.
    if (error.errorNum === 955) {
      console.log('A tabela CONVERSAS ja existe no banco. Nenhuma alteracao feita.');
    } else {
      throw error;
    }
  } finally {
    await connection.close();
    await closeOracle();
  }
}

createChatTable().catch(async (error) => {
  console.error('Erro ao criar tabela:', error.message);
  await closeOracle();
  process.exit(1);
});
