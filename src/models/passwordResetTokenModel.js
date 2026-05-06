const { getConnection } = require('../config/oracle');

async function createToken({ email, tokenHash, expiresAt }) {
  const connection = await getConnection();

  try {
    await connection.execute(
      `
        INSERT INTO PASSWORD_RESET_TOKENS (EMAIL, TOKEN_HASH, EXPIRES_AT)
        VALUES (:email, :tokenHash, :expiresAt)
      `,
      {
        email,
        tokenHash,
        expiresAt,
      }
    );

    await connection.commit();
  } finally {
    await connection.close();
  }
}

async function findValidByTokenHash(tokenHash) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT CODIGO, EMAIL, TOKEN_HASH, EXPIRES_AT, USED_AT, CREATED_AT
        FROM PASSWORD_RESET_TOKENS
        WHERE TOKEN_HASH = :tokenHash
          AND USED_AT IS NULL
          AND EXPIRES_AT > CURRENT_TIMESTAMP
        FETCH FIRST 1 ROWS ONLY
      `,
      { tokenHash }
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const token = result.rows[0];

    return {
      id: token.CODIGO,
      email: token.EMAIL,
      tokenHash: token.TOKEN_HASH,
      expiresAt: token.EXPIRES_AT,
      usedAt: token.USED_AT,
      createdAt: token.CREATED_AT,
    };
  } finally {
    await connection.close();
  }
}

async function markAsUsed(id) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        UPDATE PASSWORD_RESET_TOKENS
        SET USED_AT = CURRENT_TIMESTAMP
        WHERE CODIGO = :id
          AND USED_AT IS NULL
      `,
      { id }
    );

    await connection.commit();

    return result.rowsAffected > 0;
  } finally {
    await connection.close();
  }
}

async function deleteByEmail(email) {
  const connection = await getConnection();

  try {
    await connection.execute(
      `
        DELETE FROM PASSWORD_RESET_TOKENS
        WHERE LOWER(EMAIL) = LOWER(:email)
      `,
      { email }
    );

    await connection.commit();
  } finally {
    await connection.close();
  }
}

async function deleteExpired() {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        DELETE FROM PASSWORD_RESET_TOKENS
        WHERE EXPIRES_AT <= CURRENT_TIMESTAMP
           OR USED_AT IS NOT NULL
      `
    );

    await connection.commit();

    return result.rowsAffected || 0;
  } finally {
    await connection.close();
  }
}

module.exports = {
  createToken,
  findValidByTokenHash,
  markAsUsed,
  deleteByEmail,
  deleteExpired,
};
