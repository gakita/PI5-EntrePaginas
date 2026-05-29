const oracle = require('../config/oracle');

function parseJsonArray(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapFavorite(row) {
  const genres = parseJsonArray(row.GENEROS);

  return {
    googleBooksId: row.GOOGLE_BOOKS_ID,
    title: row.TITULO,
    author: row.AUTOR,
    coverUrl: row.CAPA_URL,
    publishedDate: row.PUBLICADO_EM,
    type: row.TIPO,
    categories: genres,
    genres,
    createdAt: row.CRIADO_EM,
  };
}

async function listByUserEmail(email) {
  const connection = await oracle.getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT GOOGLE_BOOKS_ID, TITULO, AUTOR, CAPA_URL, TO_CHAR(GENEROS) AS GENEROS, PUBLICADO_EM, TIPO, CRIADO_EM
        FROM FAVORITOS
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)
        ORDER BY CRIADO_EM DESC
      `,
      { email }
    );

    return (result.rows || []).map(mapFavorite);
  } finally {
    await connection.close();
  }
}

async function findByUserEmailAndBookId(email, googleBooksId) {
  const connection = await oracle.getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT GOOGLE_BOOKS_ID, TITULO, AUTOR, CAPA_URL, TO_CHAR(GENEROS) AS GENEROS, PUBLICADO_EM, TIPO, CRIADO_EM
        FROM FAVORITOS
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)
          AND GOOGLE_BOOKS_ID = :googleBooksId
        FETCH FIRST 1 ROWS ONLY
      `,
      { email, googleBooksId }
    );

    return result.rows && result.rows.length > 0 ? mapFavorite(result.rows[0]) : null;
  } finally {
    await connection.close();
  }
}

async function upsertByUserEmail(email, favorite) {
  const connection = await oracle.getConnection();

  try {
    await connection.execute(
      `
        MERGE INTO FAVORITOS dest
        USING (
          SELECT
            :email AS USUARIO_EMAIL,
            :googleBooksId AS GOOGLE_BOOKS_ID,
            :title AS TITULO,
            :author AS AUTOR,
            :coverUrl AS CAPA_URL,
            :genres AS GENEROS,
            :publishedDate AS PUBLICADO_EM,
            :type AS TIPO
          FROM DUAL
        ) src
        ON (
          LOWER(dest.USUARIO_EMAIL) = LOWER(src.USUARIO_EMAIL)
          AND dest.GOOGLE_BOOKS_ID = src.GOOGLE_BOOKS_ID
        )
        WHEN MATCHED THEN UPDATE SET
          dest.TITULO = src.TITULO,
          dest.AUTOR = src.AUTOR,
          dest.CAPA_URL = src.CAPA_URL,
          dest.GENEROS = src.GENEROS,
          dest.PUBLICADO_EM = src.PUBLICADO_EM,
          dest.TIPO = src.TIPO
        WHEN NOT MATCHED THEN INSERT (
          USUARIO_EMAIL,
          GOOGLE_BOOKS_ID,
          TITULO,
          AUTOR,
          CAPA_URL,
          GENEROS,
          PUBLICADO_EM,
          TIPO
        ) VALUES (
          src.USUARIO_EMAIL,
          src.GOOGLE_BOOKS_ID,
          src.TITULO,
          src.AUTOR,
          src.CAPA_URL,
          src.GENEROS,
          src.PUBLICADO_EM,
          src.TIPO
        )
      `,
      {
        email,
        googleBooksId: favorite.googleBooksId,
        title: favorite.title,
        author: favorite.author || null,
        coverUrl: favorite.coverUrl || null,
        genres: JSON.stringify(favorite.genres || []),
        publishedDate: favorite.publishedDate || null,
        type: favorite.type || 'livro',
      }
    );

    await connection.commit();

    return {
      googleBooksId: favorite.googleBooksId,
      title: favorite.title,
      author: favorite.author || null,
      coverUrl: favorite.coverUrl || null,
      publishedDate: favorite.publishedDate || null,
      type: favorite.type || 'livro',
      categories: favorite.genres || [],
      genres: favorite.genres || [],
    };
  } finally {
    await connection.close();
  }
}

async function deleteByUserEmailAndBookId(email, googleBooksId) {
  const connection = await oracle.getConnection();

  try {
    const result = await connection.execute(
      `
        DELETE FROM FAVORITOS
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)
          AND GOOGLE_BOOKS_ID = :googleBooksId
      `,
      { email, googleBooksId }
    );

    await connection.commit();

    return result.rowsAffected > 0;
  } finally {
    await connection.close();
  }
}

module.exports = {
  listByUserEmail,
  findByUserEmailAndBookId,
  upsertByUserEmail,
  deleteByUserEmailAndBookId,
};
