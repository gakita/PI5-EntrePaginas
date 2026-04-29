const { getConnection } = require('../config/oracle');

async function findByEmail(email) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        SELECT NOME, EMAIL, SENHA
        FROM FERNANDO.USUARIOS_TESTE
        WHERE LOWER(EMAIL) = LOWER(:email)
        FETCH FIRST 1 ROWS ONLY
      `,
      { email }
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    return {
      name: user.NOME,
      email: user.EMAIL,
      passwordHash: user.SENHA,
    };
  } finally {
    await connection.close();
  }
}

async function createUser({ name, email, passwordHash }) {
  const connection = await getConnection();

  try {
    await connection.execute(
      `
        INSERT INTO FERNANDO.USUARIOS_TESTE (CODIGO, NOME, EMAIL, SENHA)
        VALUES (
          (SELECT NVL(MAX(CODIGO), 0) + 1 FROM FERNANDO.USUARIOS_TESTE),
          :name,
          :email,
          :passwordHash
        )
      `,
      {
        name,
        email,
        passwordHash,
      }
    );

    await connection.commit();

    return {
      email,
      name,
      passwordHash,
    };
  } finally {
    await connection.close();
  }
}

async function updateUserByEmail(email, { name, passwordHash }) {
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      `
        UPDATE FERNANDO.USUARIOS_TESTE
        SET
          NOME = COALESCE(:name, NOME),
          SENHA = COALESCE(:passwordHash, SENHA)
        WHERE LOWER(EMAIL) = LOWER(:email)
      `,
      {
        name: name || null,
        passwordHash: passwordHash || null,
        email,
      }
    );

    await connection.commit();

    if (result.rowsAffected === 0) {
      return null;
    }
  } finally {
    await connection.close();
  }

  return findByEmail(email);
}

async function deleteOptionalUserData(connection, sql, binds) {
  try {
    await connection.execute(sql, binds);
  } catch (error) {
    if (error.errorNum !== 942) {
      throw error;
    }
  }
}

async function deleteUserByEmail(email) {
  const connection = await getConnection();

  try {
    const userResult = await connection.execute(
      `
        SELECT CODIGO
        FROM FERNANDO.USUARIOS_TESTE
        WHERE LOWER(EMAIL) = LOWER(:email)
        FETCH FIRST 1 ROWS ONLY
      `,
      { email }
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return false;
    }

    const userCode = userResult.rows[0].CODIGO;

    await deleteOptionalUserData(
      connection,
      'DELETE FROM CONVERSAS WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)',
      { email }
    );

    await deleteOptionalUserData(
      connection,
      'DELETE FROM PREFERENCIAS_USUARIO WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)',
      { email }
    );

    await deleteOptionalUserData(
      connection,
      'DELETE FROM SUGESTOES_CONVERSA WHERE LOWER(USUARIO_EMAIL) = LOWER(:email)',
      { email }
    );

    await deleteOptionalUserData(
      connection,
      'DELETE FROM AVALIACOES WHERE COD_USUARIO = :userCode',
      { userCode }
    );

    const deleteResult = await connection.execute(
      `
        DELETE FROM FERNANDO.USUARIOS_TESTE
        WHERE LOWER(EMAIL) = LOWER(:email)
      `,
      { email }
    );

    await connection.commit();

    return deleteResult.rowsAffected > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

module.exports = {
  findByEmail,
  createUser,
  updateUserByEmail,
  deleteUserByEmail,
};
