/**
 * chatModel.js — Camada de acesso a dados (Model) para o chat.
 *
 * Responsável por todas as operações no banco Oracle relacionadas
 * à tabela CONVERSAS. Segue o mesmo padrão do userModel.js:
 *   1. Pega uma conexão do pool
 *   2. Executa a query SQL
 *   3. Fecha a conexão no finally
 *
 * A tabela CONVERSAS tem um índice UNIQUE em USUARIO_EMAIL,
 * garantindo que cada usuário tenha no máximo 1 conversa salva
 * (requisito RF12: "salvar somente a última conversa").
 */

const oracledb = require('oracledb');
const { getConnection } = require('../config/oracle');

/**
 * Busca a última (e única) conversa de um usuário.
 *
 * @param {string} email - Email do usuário autenticado.
 * @returns {object|null} Objeto com as mensagens parseadas, ou null se não existir.
 */
async function findByUserEmail(email) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT CODIGO, USUARIO_EMAIL, MENSAGENS, CRIADO_EM, ATUALIZADO_EM
        FROM CONVERSAS
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)
        FETCH FIRST 1 ROWS ONLY
      `,
      { email }
    );

    // Se não encontrou nenhuma conversa, retorna null
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // A coluna MENSAGENS é CLOB — pode vir como string ou como um Lob object.
    // Precisamos garantir que lemos o conteúdo completo.
    let mensagensRaw = row.MENSAGENS;

    // Se o Oracle retornou um Lob (objeto de stream), lemos ele como string
    if (mensagensRaw && typeof mensagensRaw.getData === 'function') {
      mensagensRaw = await mensagensRaw.getData();
    }

    return {
      id: row.CODIGO,
      userEmail: row.USUARIO_EMAIL,
      messages: JSON.parse(mensagensRaw), // Converte o JSON string → array JS
      createdAt: row.CRIADO_EM,
      updatedAt: row.ATUALIZADO_EM,
    };
  } finally {
    // Sempre fecha a conexão para devolver ao pool
    await connection.close();
  }
}

/**
 * Insere ou atualiza a conversa de um usuário (upsert).
 *
 * Usa o MERGE do Oracle:
 *   - Se já existe uma conversa para esse email → UPDATE (atualiza mensagens)
 *   - Se não existe → INSERT (cria nova conversa)
 *
 * Isso garante que sempre exista no máximo 1 conversa por usuário.
 *
 * @param {string} email - Email do usuário.
 * @param {Array} messages - Array de mensagens [{role, content, timestamp}, ...].
 */
async function upsertConversation(email, messages) {
  const connection = await getConnection();

  try {
    // JSON.stringify converte o array JS em uma string JSON para salvar no CLOB
    const mensagensJson = JSON.stringify(messages);

    await connection.execute(
      `
        MERGE INTO CONVERSAS dest
        USING (SELECT :email AS EMAIL FROM DUAL) src
        ON (LOWER(dest.USUARIO_EMAIL) = LOWER(src.EMAIL))

        WHEN MATCHED THEN
          UPDATE SET
            dest.MENSAGENS = :mensagens,
            dest.ATUALIZADO_EM = CURRENT_TIMESTAMP

        WHEN NOT MATCHED THEN
          INSERT (USUARIO_EMAIL, MENSAGENS)
          VALUES (:email, :mensagens)
      `,
      {
        email,
        mensagens: { val: mensagensJson, type: oracledb.CLOB },
      }
    );

    // Confirma a transação no banco (sem commit, os dados não são persistidos)
    await connection.commit();
  } finally {
    await connection.close();
  }
}

/**
 * Remove a conversa de um usuário (limpar histórico).
 *
 * @param {string} email - Email do usuário.
 */
async function deleteByUserEmail(email) {
  const connection = await getConnection();

  try {
    await connection.execute(
      `
        DELETE FROM CONVERSAS
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)
      `,
      { email }
    );

    await connection.commit();
  } finally {
    await connection.close();
  }
}

module.exports = {
  findByUserEmail,
  upsertConversation,
  deleteByUserEmail,
};
