/**
 * suggestionModel.js — Model de sugestões salvas por conversa.
 *
 * Ao encerrar uma conversa, as recomendações do chatbot
 * são persistidas aqui com data/hora. Isso cria um histórico de
 * recomendações do usuário que pode influenciar conversas futuras.
 */

const oracledb = require('oracledb');
const { getConnection } = require('../config/oracle');

/**
 * Salva uma lista de sugestões de uma conversa encerrada.
 * Deduplica por título (ignora obras já salvas).
 *
 * @param {string} userEmail
 * @param {Array} recommendations - Array de objetos de recomendação.
 */
async function saveAll(userEmail, recommendations) {
  if (!recommendations || recommendations.length === 0) return;

  const connection = await getConnection();

  try {
    // Evita duplicar recomendações já salvas
    const existing = await connection.execute(
      `SELECT TITULO FROM SUGESTOES_CONVERSA WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)`,
      { email: userEmail }
    );

    const savedTitles = new Set(
      (existing.rows || []).map((r) => r.TITULO.toLowerCase())
    );

    // Filtra apenas novas sugestões
    const newRecs = recommendations.filter(
      (r) => r.title && !savedTitles.has(r.title.toLowerCase())
    );

    if (newRecs.length === 0) return;

    // Salva as sugestões no banco
    for (const rec of newRecs) {
      await connection.execute(
        `
          INSERT INTO SUGESTOES_CONVERSA
            (USUARIO_EMAIL, TITULO, TIPO, AUTOR, JUSTIFICATIVA, TEMA_SENSIVEL, CAPA_URL, SINOPSE)
          VALUES
            (:email, :titulo, :tipo, :autor, :justificativa, :temaSensivel, :capaUrl, :sinopse)
        `,
        {
          email:         userEmail,
          titulo:        rec.title        || 'Sem título',
          tipo:          rec.type         || null,
          autor:         rec.author       || null,
          justificativa: { val: rec.justification || null, type: oracledb.CLOB },
          temaSensivel:  rec.sensitiveContent ? 1 : 0,
          capaUrl:       rec.coverUrl     || null,
          sinopse:       { val: rec.synopsis || null, type: oracledb.CLOB },
        }
      );
    }

    await connection.commit();
  } finally {
    await connection.close();
  }
}

/**
 * Retorna o histórico de sugestões de um usuário.
 *
 * @param {string} userEmail
 * @param {number} limit - Número máximo de registros (padrão: 20).
 */
async function findByUserEmail(userEmail, limit = 20) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT TITULO, TIPO, AUTOR, TEMA_SENSIVEL, CAPA_URL, CRIADO_EM
        FROM SUGESTOES_CONVERSA
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)
        ORDER BY CRIADO_EM DESC
        FETCH FIRST :limit ROWS ONLY
      `,
      { email: userEmail, limit }
    );

    return (result.rows || []).map((row) => ({
      title:          row.TITULO,
      type:           row.TIPO,
      author:         row.AUTOR,
      sensitiveContent: row.TEMA_SENSIVEL === 1,
      coverUrl:       row.CAPA_URL,
      suggestedAt:    row.CRIADO_EM,
    }));
  } finally {
    await connection.close();
  }
}

module.exports = {
  saveAll,
  findByUserEmail,
};
