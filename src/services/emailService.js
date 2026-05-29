const nodemailer = require('nodemailer');

const env = require('../config/env');

function isEmailConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

function createTransporter() {
  return nodemailer.createTransport({
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
}

function createMailpitTransporter() {
  return nodemailer.createTransport({
    host: env.mailpitHost,
    port: env.mailpitPort,
    secure: false,
    connectionTimeout: 2000,
    greetingTimeout: 2000,
    socketTimeout: 2000,
  });
}

function buildResetMessage({ email, token }) {
  const resetUrl = env.passwordResetFrontendUrl
    ? `${env.passwordResetFrontendUrl}?token=${encodeURIComponent(token)}`
    : null;

  const resetInstruction = resetUrl
    ? `Acesse o link abaixo para cadastrar uma nova senha:\n\n${resetUrl}`
    : `Use este token para cadastrar uma nova senha:\n\n${token}`;

  return {
    from: env.mailFrom,
    to: email,
    subject: 'Recuperacao de senha - Entre Paginas',
    text: [
      'Recebemos uma solicitacao para recuperar a senha da sua conta.',
      '',
      resetInstruction,
      '',
      `Este codigo expira em ${env.passwordResetTokenMinutes} minutos.`,
      '',
      'Se voce nao solicitou essa alteracao, ignore este e-mail.',
    ].join('\n'),
  };
}

function buildVerificationMessage({ email, code }) {
  return {
    from: env.mailFrom,
    to: email,
    subject: 'Confirmacao de cadastro - Entre Paginas',
    text: [
      'Seja bem-vindo ao Entre Paginas!',
      '',
      `Seu codigo de verificacao de e-mail e: ${code}`,
      '',
      'Insira esse codigo no sistema para ativar a sua conta.',
      '',
      'Se voce nao realizou este cadastro, por favor ignore este e-mail.',
    ].join('\n'),
  };
}

async function sendPasswordResetEmail({ email, token }) {
  let sentReal = false;
  let sentMailpit = false;

  // 1. Enviar e-mail real
  if (isEmailConfigured()) {
    try {
      const transporter = createTransporter();
      await Promise.race([
        transporter.sendMail(buildResetMessage({ email, token })),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SMTP timeout')), env.smtpTimeoutMs);
        }),
      ]);
      sentReal = true;
    } catch (error) {
      console.error('Erro ao enviar e-mail real de recuperacao de senha:', error.message);
    }
  }

  // 2. Enviar para o Mailpit (se habilitado)
  if (env.mailpitEnabled) {
    try {
      const mailpitTransporter = createMailpitTransporter();
      await mailpitTransporter.sendMail(buildResetMessage({ email, token }));
      sentMailpit = true;
    } catch (error) {
      console.warn('Mailpit local offline ou falhou:', error.message);
    }
  }

  return sentReal || sentMailpit;
}

async function sendVerificationEmail({ email, code }) {
  let sentReal = false;
  let sentMailpit = false;

  // 1. Enviar e-mail real
  if (isEmailConfigured()) {
    try {
      const transporter = createTransporter();
      await Promise.race([
        transporter.sendMail(buildVerificationMessage({ email, code })),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SMTP timeout')), env.smtpTimeoutMs);
        }),
      ]);
      sentReal = true;
    } catch (error) {
      console.error('Erro ao enviar e-mail real de verificacao:', error.message);
    }
  }

  // 2. Enviar para o Mailpit (se habilitado)
  if (env.mailpitEnabled) {
    try {
      const mailpitTransporter = createMailpitTransporter();
      await mailpitTransporter.sendMail(buildVerificationMessage({ email, code }));
      sentMailpit = true;
    } catch (error) {
      console.warn('Mailpit local offline ou falhou:', error.message);
    }
  }

  return sentReal || sentMailpit;
}

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
