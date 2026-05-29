const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nome, email e senha sao obrigatorios.',
      });
    }

    const result = await authService.register(name, email, password);

    return res.status(201).json({
      message: 'Usuario cadastrado com sucesso.',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email e senha sao obrigatorios.',
      });
    }

    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({
        message: 'Credenciais invalidas.',
      });
    }

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({
        message: 'Email e obrigatorio.',
      });
    }

    const result = await authService.requestPasswordReset(email);
    const response = {
      message: 'Se o email estiver cadastrado, enviaremos as instrucoes de recuperacao.',
    };

    if (result.resetToken) {
      response.resetToken = result.resetToken;
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (typeof token !== 'string' || token.trim().length === 0 || !newPassword) {
      return res.status(400).json({
        message: 'Token e nova senha sao obrigatorios.',
      });
    }

    await authService.resetPassword(token, newPassword);

    return res.status(200).json({
      message: 'Senha redefinida com sucesso.',
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const userModel = require('../models/userModel');
    const user = await userModel.findByEmail(req.user.email);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario nao encontrado.',
      });
    }

    return res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const updatedUser = await authService.updateMe(req.user.email, req.body);

    return res.status(200).json({
      message: 'Usuario atualizado com sucesso.',
      user: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteMe(req, res, next) {
  try {
    await authService.deleteMe(req.user.email, req.body);

    return res.status(200).json({
      message: 'Conta deletada com sucesso.',
    });
  } catch (error) {
    return next(error);
  }
}

async function sendCode(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: 'O campo "email" e obrigatorio.',
      });
    }

    const result = await authService.sendVerificationCode(email);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function verifyCode(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        message: 'Os campos "email" e "code" sao obrigatorios.',
      });
    }

    const result = await authService.verifyCode(email, code);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  me,
  updateMe,
  deleteMe,
  sendCode,
  verifyCode,
};
