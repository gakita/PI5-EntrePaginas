const catalogService = require('../services/catalogService');

async function searchBook(req, res, next) {
  try {
    const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
    const author = typeof req.query.author === 'string' ? req.query.author.trim() : '';

    if (!title) {
      return res.status(400).json({
        message: 'O parametro "title" e obrigatorio.',
      });
    }

    const book = await catalogService.findBookMetadata({ title, author });
    return res.status(200).json(book);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  searchBook,
};
