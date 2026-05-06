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
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
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

async function sendPasswordResetEmail({ email, token }) {
  if (!isEmailConfigured()) {
    return false;
  }

  const transporter = createTransporter();
  await transporter.sendMail(buildResetMessage({ email, token }));

  return true;
}

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
};
