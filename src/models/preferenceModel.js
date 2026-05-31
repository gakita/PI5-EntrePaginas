/**
 * preferenceModel.js — Model de preferências do usuário.
 *
 * Cada usuário tem um único registro de preferências que é
 * criado/atualizado ao encerrar uma conversa.
 *
 * As preferências são usadas pelo llmService para personalizar
 * o prompt enviado ao Gemini — tornando as recomendações mais
 * relevantes para aquele usuário específico.
 */

const oracledb = require('oracledb');
const { getConnection } = require('../config/oracle');

/**
 * Busca as preferências de um usuário.
 *
 * @param {string} email
 * @returns {object|null} Preferências parseadas, ou null se não existir.
 */
async function findByUserEmail(email) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT GENEROS, TIPOS, AUTORES_FAVORITOS, TEMAS_SENSIVEIS, ATUALIZADO_EM
        FROM PREFERENCIAS_USUARIO
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)
        FETCH FIRST 1 ROWS ONLY
      `,
      { email }
    );

    if (!result.rows || result.rows.length === 0) return null;

    const row = result.rows[0];

    // Lê CLOBs (podem vir como Lob object ou string)
    async function readClob(val) {
      if (!val) return [];
      if (typeof val.getData === 'function') val = await val.getData();
      try { return JSON.parse(val); } catch { return []; }
    }

    return {
      genres:          await readClob(row.GENEROS),
      types:           await readClob(row.TIPOS),
      favoriteAuthors: await readClob(row.AUTORES_FAVORITOS),
      sensitiveThemes: await readClob(row.TEMAS_SENSIVEIS),
      updatedAt:       row.ATUALIZADO_EM,
    };
  } finally {
    await connection.close();
  }
}

/**
 * Insere ou atualiza as preferências do usuário (upsert via MERGE).
 *
 * Mescla as preferências novas com as existentes, evitando duplicações:
 *   - Se o gênero "ficção científica" já estava salvo, não duplica.
 *
 * @param {string} email
 * @param {{ genres: string[], types: string[], favoriteAuthors: string[], sensitiveThemes: string[] }} preferences
 */
async function upsertPreferences(email, { genres = [], types = [], favoriteAuthors = [], sensitiveThemes = [] }) {
  const connection = await getConnection();

  try {
    // Busca as preferências existentes para mesclar
    const existing = await findByUserEmail(email);

    // Mescla listas removendo duplicatas (Set garante unicidade)
    const mergedGenres    = [...new Set([...(existing?.genres || []),          ...genres])];
    const mergedTypes     = [...new Set([...(existing?.types || []),           ...types])];
    const mergedAuthors   = [...new Set([...(existing?.favoriteAuthors || []), ...favoriteAuthors])];
    const mergedSensitive = [...new Set([...(existing?.sensitiveThemes || []), ...sensitiveThemes])];

    const genresJson    = JSON.stringify(mergedGenres);
    const typesJson     = JSON.stringify(mergedTypes);
    const authorsJson   = JSON.stringify(mergedAuthors);
    const sensitiveJson = JSON.stringify(mergedSensitive);

    await connection.execute(
      `
        MERGE INTO PREFERENCIAS_USUARIO dest
        USING (SELECT :email AS EMAIL FROM DUAL) src
        ON (LOWER(dest.USUARIO_EMAIL) = LOWER(src.EMAIL))

        WHEN MATCHED THEN
          UPDATE SET
            dest.GENEROS           = :generos,
            dest.TIPOS             = :tipos,
            dest.AUTORES_FAVORITOS = :autores,
            dest.TEMAS_SENSIVEIS   = :temas,
            dest.ATUALIZADO_EM     = CURRENT_TIMESTAMP

        WHEN NOT MATCHED THEN
          INSERT (USUARIO_EMAIL, GENEROS, TIPOS, AUTORES_FAVORITOS, TEMAS_SENSIVEIS)
          VALUES (:email, :generos, :tipos, :autores, :temas)
      `,
      {
        email,
        generos: { val: genresJson,    type: oracledb.CLOB },
        tipos:   { val: typesJson,     type: oracledb.CLOB },
        autores: { val: authorsJson,   type: oracledb.CLOB },
        temas:   { val: sensitiveJson, type: oracledb.CLOB },
      }
    );

    await connection.commit();

    return {
      genres: mergedGenres,
      types: mergedTypes,
      favoriteAuthors: mergedAuthors,
      sensitiveThemes: mergedSensitive,
    };
  } finally {
    await connection.close();
  }
}

async function deleteByUserEmail(email) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        DELETE FROM PREFERENCIAS_USUARIO
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)
      `,
      { email }
    );

    await connection.commit();

    return result.rowsAffected > 0;
  } finally {
    await connection.close();
  }
}

module.exports = {
  findByUserEmail,
  upsertPreferences,
  deleteByUserEmail,
};
