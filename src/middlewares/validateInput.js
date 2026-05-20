/**
 * validateInput.js — Middleware para validação de entrada usando Joi
 *
 * Valida o corpo da requisição contra um schema Joi e retorna
 * erro 400 se a validação falhar.
 */

function validateInput(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retorna todos os erros, não apenas o primeiro
      stripUnknown: true, // Remove campos desconhecidos
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        message: 'Validação falhou',
        errors: messages,
      });
    }

    req.body = value;
    next();
  };
}

module.exports = validateInput;
