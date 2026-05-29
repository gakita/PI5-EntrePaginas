const emailService = require('../src/services/emailService');

async function main() {
  console.log('Verificando se o e-mail está configurado...');
  const configured = emailService.isEmailConfigured();
  console.log(`E-mail configurado: ${configured}`);

  if (!configured) {
    console.log('Aviso: As variáveis SMTP não estão configuradas no .env.');
    console.log('O envio retornará false imediatamente (simulação).');
  }

  try {
    console.log('Enviando e-mail de verificação de teste...');
    const result = await emailService.sendVerificationEmail({
      email: 'teste@example.com',
      code: '123456'
    });
    console.log(`Resultado do envio: ${result}`);
  } catch (error) {
    console.error('Erro ao enviar e-mail de teste:', error.message);
  }
}

main();
