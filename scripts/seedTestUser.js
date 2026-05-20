const bcrypt = require('bcrypt');

const { initializeOracle, getConnection, closeOracle } = require('../src/config/oracle');

function getArgValue(flag) {
  const argument = process.argv.find((item) => item.startsWith(`${flag}=`));
  return argument ? argument.split('=').slice(1).join('=') : undefined;
}

async function seedUser() {
  const email = getArgValue('--email') || process.env.SEED_USER_EMAIL;
  const password = getArgValue('--password') || process.env.SEED_USER_PASSWORD;
  const name =
    getArgValue('--name') ||
    process.env.SEED_USER_NAME ||
    email?.split('@')[0] ||
    'Administrador';

  if (!email || !password) {
    console.error('Use: npm run seed:user -- --email=usuario@exemplo.com --password=123456 [--name=Administrador]');
    process.exit(1);
  }

  await initializeOracle();
  const connection = await getConnection();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await connection.execute(
      `
        MERGE INTO FERNANDO.USUARIOS_TESTE target
        USING (
          SELECT
            :email AS EMAIL,
            :senha AS SENHA,
            :nome AS NOME,
            (SELECT NVL(MAX(CODIGO), 0) + 1 FROM FERNANDO.USUARIOS_TESTE) AS CODIGO
          FROM dual
        ) source
        ON (LOWER(target.EMAIL) = LOWER(source.EMAIL))
        WHEN MATCHED THEN
          UPDATE SET
            target.NOME = source.NOME,
            target.SENHA = source.SENHA
        WHEN NOT MATCHED THEN
          INSERT (CODIGO, NOME, EMAIL, SENHA)
          VALUES (source.CODIGO, source.NOME, source.EMAIL, source.SENHA)
      `,
      {
        email: email.trim().toLowerCase(),
        nome: name.trim(),
        senha: passwordHash,
      }
    );

    await connection.commit();

    console.log(`Usuario de teste inserido/atualizado: ${email.trim().toLowerCase()}`);
  } finally {
    await connection.close();
    await closeOracle();
  }
}

seedUser().catch(async (error) => {
  console.error('Erro ao inserir usuario de teste:', error.message);
  await closeOracle();
  process.exit(1);
});
