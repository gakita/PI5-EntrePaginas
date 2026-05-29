const favoriteModel = require('../models/favoriteModel');

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : [];
}

async function listFavorites(req, res, next) {
  try {
    const favorites = await favoriteModel.listByUserEmail(req.user.email);
    return res.status(200).json(favorites);
  } catch (error) {
    return next(error);
  }
}

async function addFavorite(req, res, next) {
  try {
    const googleBooksId = typeof req.body.googleBooksId === 'string' ? req.body.googleBooksId.trim() : '';
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';

    if (!googleBooksId || !title) {
      return res.status(400).json({
        message: 'Os campos "googleBooksId" e "title" sao obrigatorios.',
      });
    }

    const favorite = await favoriteModel.upsertByUserEmail(req.user.email, {
      googleBooksId,
      title,
      author: typeof req.body.author === 'string' ? req.body.author.trim() : '',
      coverUrl: typeof req.body.coverUrl === 'string' ? req.body.coverUrl.trim() : '',
      publishedDate: typeof req.body.publishedDate === 'string' ? req.body.publishedDate.trim() : '',
      type: typeof req.body.type === 'string' ? req.body.type.trim() : 'livro',
      genres: normalizeStringArray(req.body.genres || req.body.categories),
    });

    return res.status(200).json(favorite);
  } catch (error) {
    return next(error);
  }
}

async function removeFavorite(req, res, next) {
  try {
    const googleBooksId = typeof req.params.id === 'string' ? req.params.id.trim() : '';

    if (!googleBooksId) {
      return res.status(400).json({
        message: 'Id do livro e obrigatorio.',
      });
    }

    await favoriteModel.deleteByUserEmailAndBookId(req.user.email, googleBooksId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite,
};
