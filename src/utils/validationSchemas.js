/**
 * validationSchemas.js — Schemas Joi para validação de entrada
 *
 * Schemas reutilizáveis para validar dados de entrada em diferentes rotas.
 */

const Joi = require('joi');

// Validação de e-mail
const emailSchema = Joi.string()
  .email()
  .lowercase()
  .trim()
  .required()
  .messages({
    'string.email': 'E-mail inválido',
    'any.required': 'E-mail é obrigatório',
  });

// Validação de senha (mínimo 8 caracteres, pelo menos 1 número e 1 letra maiúscula)
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/)
  .pattern(/[0-9]/)
  .required()
  .messages({
    'string.min': 'Senha deve ter no mínimo 8 caracteres',
    'string.pattern.base': 'Senha deve conter pelo menos 1 letra maiúscula e 1 número',
    'any.required': 'Senha é obrigatória',
  });

const schemas = {
  // Registro de novo usuário
  register: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Nome deve ter no mínimo 3 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
        'any.required': 'Nome é obrigatório',
      }),
    email: emailSchema,
    password: passwordSchema,
  }).required(),

  // Login
  login: Joi.object({
    email: emailSchema,
    password: Joi.string().required().messages({
      'any.required': 'Senha é obrigatória',
    }),
  }).required(),

  // Recuperação de senha
  forgotPassword: Joi.object({
    email: emailSchema,
  }).required(),

  // Reset de senha
  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Token é obrigatório',
    }),
    newPassword: passwordSchema,
  }).required(),

  // Atualização de perfil
  updateProfile: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'Nome deve ter no mínimo 3 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
      }),
    email: Joi.when('email', {
      is: Joi.exist(),
      then: emailSchema.required(),
      otherwise: Joi.optional(),
    }),
  }).required(),

  // Mensagem de chat
  chatMessage: Joi.object({
    message: Joi.string()
      .trim()
      .min(1)
      .max(2000)
      .required()
      .messages({
        'string.min': 'Mensagem não pode estar vazia',
        'string.max': 'Mensagem não pode exceder 2000 caracteres',
        'any.required': 'Mensagem é obrigatória',
      }),
  }).required(),

  // Resposta de quiz
  quizAnswer: Joi.object({
    questionId: Joi.number().positive().required().messages({
      'any.required': 'ID da questão é obrigatório',
    }),
    selectedOption: Joi.number().min(0).max(3).required().messages({
      'any.required': 'Opção selecionada é obrigatória',
    }),
  }).required(),

  // Avaliação de livro
  bookEvaluation: Joi.object({
    bookId: Joi.string().required().messages({
      'any.required': 'ID do livro é obrigatório',
    }),
    rating: Joi.number().min(1).max(5).required().messages({
      'number.min': 'Nota deve ser entre 1 e 5',
      'number.max': 'Nota deve ser entre 1 e 5',
      'any.required': 'Nota é obrigatória',
    }),
    review: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Avaliação não pode exceder 1000 caracteres',
      }),
  }).required(),

  // Preferências do usuário
  preferences: Joi.object({
    favoriteCategories: Joi.array()
      .items(Joi.string())
      .optional()
      .messages({
        'array.base': 'Categorias favoritas deve ser um array',
      }),
    sensivelThemes: Joi.array()
      .items(Joi.string())
      .optional()
      .messages({
        'array.base': 'Temas sensíveis deve ser um array',
      }),
  }).required(),
};

module.exports = schemas;
