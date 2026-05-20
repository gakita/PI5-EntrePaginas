/**
 * avaliacaoModel.js — Avaliações de usuários para itens do Google Books.
 *
 * Mantém compatibilidade com os consumidores existentes do chat/quiz ao
 * continuar retornando title/rating/comment em `findReadBooksByUserEmail`.
 */

const oracle = require('../config/oracle');

async function listByUserEmail(email) {
  const connection = await oracle.getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT A.GOOGLE_BOOKS_ID, A.TITULO, A.NOTA, A.COMENTARIO
        FROM AVALIACOES A
        JOIN FERNANDO.USUARIOS_TESTE U ON A.COD_USUARIO = U.CODIGO
        WHERE LOWER(U.EMAIL) = LOWER(:email)
        ORDER BY A.DT_AVALIACAO DESC
      `,
      { email }
    );

    return (result.rows || []).map((row) => ({
      googleBooksId: row.GOOGLE_BOOKS_ID,
      title: row.TITULO,
      rating: row.NOTA,
      comment: row.COMENTARIO,
    }));
  } finally {
    await connection.close();
  }
}

async function upsertByUserEmail(email, { googleBooksId, title, rating, comment }) {
  const connection = await oracle.getConnection();

  try {
    const existing = await connection.execute(
      `
        SELECT A.CODIGO
        FROM AVALIACOES A
        JOIN FERNANDO.USUARIOS_TESTE U ON A.COD_USUARIO = U.CODIGO
        WHERE LOWER(U.EMAIL) = LOWER(:e)
          AND A.GOOGLE_BOOKS_ID = :gbid
          AND ROWNUM = 1
      `,
      { e: email, gbid: googleBooksId }
    );

    if (existing.rows && existing.rows.length > 0) {
      const id = existing.rows[0].CODIGO;

      await connection.execute(
        `
          UPDATE AVALIACOES
          SET
            TITULO = :title,
            NOTA = :rating,
            COMENTARIO = :comment,
            DT_AVALIACAO = CURRENT_TIMESTAMP
          WHERE CODIGO = :id
        `,
        {
          id,
          title,
          rating,
          comment: comment || null,
        }
      );
    } else {
      await connection.execute(
        `
          INSERT INTO AVALIACOES (GOOGLE_BOOKS_ID, TITULO, NOTA, COMENTARIO, COD_USUARIO)
          SELECT :gbid, :t, :r, :c, CODIGO
          FROM FERNANDO.USUARIOS_TESTE
          WHERE LOWER(EMAIL) = LOWER(:e)
            AND ROWNUM = 1
        `,
        {
          gbid: googleBooksId,
          t: title,
          r: rating,
          c: comment || null,
          e: email,
        }
      );
    }

    await connection.commit();

    return {
      googleBooksId,
      title,
      rating,
      comment: comment || null,
    };
  } finally {
    await connection.close();
  }
}

async function findReadBooksByUserEmail(email) {
  const evaluations = await listByUserEmail(email);

  return evaluations.map((item) => ({
    title: item.title,
    rating: item.rating,
    comment: item.comment,
  }));
}

module.exports = {
  listByUserEmail,
  upsertByUserEmail,
  findReadBooksByUserEmail,
};
