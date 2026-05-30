const catalogService = require('../services/catalogService');

async function getCategories(req, res, next) {
  try {
    const categories = catalogService.getHomeCategories();
    return res.status(200).json(categories);
  } catch (error) {
    return next(error);
  }
}

async function listBooks(req, res, next) {
  try {
    const page = Number.parseInt(req.query.page, 10);
    const limit = Number.parseInt(req.query.limit, 10);

    const result = await catalogService.searchCatalog({
      search: typeof req.query.search === 'string' ? req.query.search.trim() : '',
      author: typeof req.query.author === 'string' ? req.query.author.trim() : '',
      category: typeof req.query.category === 'string' ? req.query.category.trim() : '',
      theme: typeof req.query.theme === 'string' ? req.query.theme.trim() : '',
      type: typeof req.query.type === 'string' ? req.query.type.trim() : '',
      page: Number.isNaN(page) ? undefined : page,
      limit: Number.isNaN(limit) ? undefined : limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

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

async function getBookById(req, res, next) {
  try {
    const id = req.params.id;
    const book = await catalogService.getBookById(id);
    if (!book) {
      return res.status(404).json({ message: 'Livro nao encontrado.' });
    }
    return res.status(200).json(book);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCategories,
  listBooks,
  searchBook,
  getBookById,
};
