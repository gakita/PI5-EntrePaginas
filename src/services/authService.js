const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const emailService = require('./emailService');
const passwordResetTokenModel = require('../models/passwordResetTokenModel');
const userModel = require('../models/userModel');
const logger = require('../utils/logger');

function sanitizeUser(user) {
  return {
    name: user.name,
    email: user.email,
  };
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.email,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function register(name, email, password) {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await userModel.findByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error('Email ja cadastrado.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModel.createUser({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
  });
  const safeUser = sanitizeUser(user);
  const token = generateToken(safeUser);

  return {
    user: safeUser,
    token,
  };
}

async function requestPasswordReset(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await userModel.findByEmail(normalizedEmail);

  if (!user) {
    return {
      emailSent: false,
    };
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + env.passwordResetTokenMinutes * 60 * 1000);

  await passwordResetTokenModel.deleteByEmail(normalizedEmail);
  await passwordResetTokenModel.createToken({
    email: normalizedEmail,
    tokenHash,
    expiresAt,
  });

  let emailSent = false;

  try {
    emailSent = await emailService.sendPasswordResetEmail({
      email: normalizedEmail,
      token,
    });
  } catch (error) {
    logger.error('Password reset email failed', {
      email: normalizedEmail,
      error: error.message,
    });
  }

  return {
    emailSent,
    resetToken: env.nodeEnv === 'production' ? undefined : token,
  };
}

async function resetPassword(token, newPassword) {
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    const error = new Error('Nova senha deve ter pelo menos 6 caracteres.');
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = hashResetToken(token.trim());
  const resetToken = await passwordResetTokenModel.findValidByTokenHash(tokenHash);

  if (!resetToken) {
    const error = new Error('Token invalido ou expirado.');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updatedUser = await userModel.updateUserByEmail(resetToken.email, { passwordHash });

  if (!updatedUser) {
    const error = new Error('Usuario nao encontrado.');
    error.statusCode = 404;
    throw error;
  }

  await passwordResetTokenModel.markAsUsed(resetToken.id);

  return sanitizeUser(updatedUser);
}

async function login(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await userModel.findByEmail(normalizedEmail);

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  const safeUser = sanitizeUser(user);
  const token = generateToken(safeUser);

  return {
    user: safeUser,
    token,
  };
}

async function updateMe(currentEmail, data = {}) {
  const user = await userModel.findByEmail(currentEmail);

  if (!user) {
    const error = new Error('Usuario nao encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const updates = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      const error = new Error('Nome nao pode ser vazio.');
      error.statusCode = 400;
      throw error;
    }

    updates.name = data.name.trim();
  }

  if (data.newPassword !== undefined) {
    if (typeof data.currentPassword !== 'string' || data.currentPassword.length === 0) {
      const error = new Error('Senha atual e obrigatoria para alterar a senha.');
      error.statusCode = 400;
      throw error;
    }

    if (typeof data.newPassword !== 'string' || data.newPassword.length < 6) {
      const error = new Error('Nova senha deve ter pelo menos 6 caracteres.');
      error.statusCode = 400;
      throw error;
    }

    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      const error = new Error('Senha atual invalida.');
      error.statusCode = 401;
      throw error;
    }

    updates.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  if (!updates.name && !updates.passwordHash) {
    const error = new Error('Informe ao menos um campo para atualizar.');
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await userModel.updateUserByEmail(currentEmail, updates);

  if (!updatedUser) {
    const error = new Error('Usuario nao encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(updatedUser);
}

async function deleteMe(currentEmail, data = {}) {
  const user = await userModel.findByEmail(currentEmail);

  if (!user) {
    const error = new Error('Usuario nao encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (typeof data.currentPassword !== 'string' || data.currentPassword.length === 0) {
    const error = new Error('Senha atual e obrigatoria para deletar a conta.');
    error.statusCode = 400;
    throw error;
  }

  const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    const error = new Error('Senha atual invalida.');
    error.statusCode = 401;
    throw error;
  }

  const deleted = await userModel.deleteUserByEmail(currentEmail);

  if (!deleted) {
    const error = new Error('Usuario nao encontrado.');
    error.statusCode = 404;
    throw error;
  }
}

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  updateMe,
  deleteMe,
};
