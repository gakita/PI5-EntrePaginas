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

module.exports = {
  findByEmail,
  createUser,
};
