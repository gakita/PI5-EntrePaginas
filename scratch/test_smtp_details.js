const nodemailer = require('nodemailer');
const env = require('../src/config/env');

async function testSMTP() {
  console.log('Env variables:', {
    smtpHost: env.smtpHost,
    smtpPort: env.smtpPort,
    smtpSecure: env.smtpSecure,
    smtpUser: env.smtpUser,
    mailFrom: env.mailFrom,
    smtpTimeoutMs: env.smtpTimeoutMs,
  });

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    connectionTimeout: env.smtpTimeoutMs,
    greetingTimeout: env.smtpTimeoutMs,
    socketTimeout: env.smtpTimeoutMs,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  try {
    console.log('Verifying connection with SMTP transporter...');
    await transporter.verify();
    console.log('Transporter verified successfully!');

    console.log('Sending test email to the same address...');
    const info = await transporter.sendMail({
      from: env.mailFrom,
      to: env.smtpUser,
      subject: 'Teste de Envio de Email - Entre Paginas',
      text: 'Este e um email de teste para verificar a configuracao do SMTP.',
    });

    console.log('Email sent successfully!', info);
  } catch (error) {
    console.error('SMTP test failed with error:', error);
  }
}

testSMTP();
