const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const userModel = require('../models/userModel');

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

module.exports = {
  register,
  login,
};
