const oracledb = require('oracledb');
const { getConnection } = require('../config/oracle');

async function readJsonClob(value, fallback) {
  if (!value) return fallback;
  let raw = value;
  if (raw && typeof raw.getData === 'function') {
    raw = await raw.getData();
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function serializeSession(session) {
  return {
    sessionId: session.sessionId,
    userEmail: session.userEmail,
    maxQuestions: session.maxQuestions,
    questions: session.questions || [],
    answers: session.answers || [],
    finished: Boolean(session.finished),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

async function mapRow(row) {
  return {
    sessionId: row.SESSION_ID,
    userEmail: row.USUARIO_EMAIL,
    maxQuestions: row.MAX_PERGUNTAS || 8,
    questions: await readJsonClob(row.PERGUNTAS, []),
    answers: await readJsonClob(row.RESPOSTAS, []),
    finished: row.FINALIZADO === 1,
    createdAt: row.CRIADO_EM,
    updatedAt: row.ATUALIZADO_EM,
  };
}

async function findActiveBySessionId(userEmail, sessionId) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT SESSION_ID, USUARIO_EMAIL, MAX_PERGUNTAS, PERGUNTAS, RESPOSTAS,
               FINALIZADO, CRIADO_EM, ATUALIZADO_EM
        FROM QUIZ_SESSOES
        WHERE LOWER(USUARIO_EMAIL) = LOWER(:userEmail)
          AND SESSION_ID = :sessionId
        FETCH FIRST 1 ROWS ONLY
      `,
      { userEmail, sessionId }
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    return mapRow(result.rows[0]);
  } finally {
    await connection.close();
  }
}

async function upsertActiveSession(userEmail, session) {
  const connection = await getConnection();
  const normalized = serializeSession({ ...session, userEmail });

  try {
    await connection.execute(
      `
        MERGE INTO QUIZ_SESSOES dest
        USING (SELECT :userEmail AS USUARIO_EMAIL FROM DUAL) src
        ON (LOWER(dest.USUARIO_EMAIL) = LOWER(src.USUARIO_EMAIL))

        WHEN MATCHED THEN
          UPDATE SET
            dest.SESSION_ID    = :sessionId,
            dest.MAX_PERGUNTAS = :maxQuestions,
            dest.PERGUNTAS     = :questions,
            dest.RESPOSTAS     = :answers,
            dest.FINALIZADO    = :finished,
            dest.ATUALIZADO_EM = CURRENT_TIMESTAMP

        WHEN NOT MATCHED THEN
          INSERT (SESSION_ID, USUARIO_EMAIL, MAX_PERGUNTAS, PERGUNTAS, RESPOSTAS, FINALIZADO)
          VALUES (:sessionId, :userEmail, :maxQuestions, :questions, :answers, :finished)
      `,
      {
        userEmail,
        sessionId: normalized.sessionId,
        maxQuestions: normalized.maxQuestions,
        questions: { val: JSON.stringify(normalized.questions), type: oracledb.CLOB },
        answers: { val: JSON.stringify(normalized.answers), type: oracledb.CLOB },
        finished: normalized.finished ? 1 : 0,
      }
    );

    await connection.commit();
    return normalized;
  } finally {
    await connection.close();
  }
}

module.exports = {
  findActiveBySessionId,
  upsertActiveSession,
};
