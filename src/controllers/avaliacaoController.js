const avaliacaoModel = require('../models/avaliacaoModel');

async function getMyEvaluations(req, res, next) {
  try {
    const evaluations = await avaliacaoModel.listByUserEmail(req.user.email);
    return res.status(200).json(evaluations);
  } catch (error) {
    return next(error);
  }
}

async function upsertEvaluation(req, res, next) {
  try {
    const googleBooksId = typeof req.body.googleBooksId === 'string' ? req.body.googleBooksId.trim() : '';
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    const rating = Number(req.body.rating);

    if (!googleBooksId || !title) {
      return res.status(400).json({
        message: 'Os campos "googleBooksId" e "title" sao obrigatorios.',
      });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'O campo "rating" deve ser um numero entre 1 e 5.',
      });
    }

    const saved = await avaliacaoModel.upsertByUserEmail(req.user.email, {
      googleBooksId,
      title,
      rating,
      comment,
    });

    return res.status(200).json(saved);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyEvaluations,
  upsertEvaluation,
};
