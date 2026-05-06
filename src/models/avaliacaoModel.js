/**
 * avaliacaoModel.js — Model de avaliações do usuário (Histórico de leitura).
 *
 * Utiliza a tabela AVALIACOES para buscar os livros que o usuário já leu
 * e avaliou, enviando esse contexto para o assistente de IA.
 */

const { getConnection } = require('../config/oracle');

/**
 * Busca os livros avaliados por um usuário específico (via email).
 *
 * Faz um JOIN entre AVALIACOES, USUARIOS_TESTE e LIVROS para
 * retornar os títulos lidos, a nota dada e os comentários.
 *
 * @param {string} email - O e-mail do usuário logado no chat.
 * @returns {Array} Array de livros lidos com nota e comentário.
 */
async function findReadBooksByUserEmail(email) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT L.TITULO, A.NOTA, A.COMENTARIO
        FROM AVALIACOES A
        JOIN FERNANDO.LIVROS L ON A.COD_LIVRO = L.CODIGO
        JOIN FERNANDO.USUARIOS_TESTE U ON A.COD_USUARIO = U.CODIGO
        WHERE LOWER(U.EMAIL) = LOWER(:email)
        ORDER BY A.DT_AVALIACAO DESC
      `,
      { email }
    );

    return (result.rows || []).map((row) => ({
      title: row.TITULO,
      rating: row.NOTA,
      comment: row.COMENTARIO,
    }));
  } finally {
    await connection.close();
  }
}

module.exports = {
  findReadBooksByUserEmail,
};
