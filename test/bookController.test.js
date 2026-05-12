const test = require('node:test');
const assert = require('node:assert/strict');

const bookController = require('../src/controllers/bookController');
const catalogService = require('../src/services/catalogService');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('getCategories returns curated categories payload', async () => {
  const originalGetHomeCategories = catalogService.getHomeCategories;

  catalogService.getHomeCategories = () => [{ slug: 'fantasia' }];

  const req = {};
  const res = createResponse();

  try {
    await bookController.getCategories(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ slug: 'fantasia' }]);
  } finally {
    catalogService.getHomeCategories = originalGetHomeCategories;
  }
});

test('listBooks forwards filters to catalog service', async () => {
  const originalSearchCatalog = catalogService.searchCatalog;

  catalogService.searchCatalog = async (filters) => {
    assert.deepEqual(filters, {
      search: 'duna',
      author: 'Frank Herbert',
      category: 'science fiction',
      theme: 'space opera',
      type: 'livro',
      page: 3,
      limit: 5,
    });

    return { items: [], page: 3, limit: 5, totalItems: 0 };
  };

  const req = {
    query: {
      search: ' duna ',
      author: ' Frank Herbert ',
      category: ' science fiction ',
      theme: ' space opera ',
      type: ' livro ',
      page: '3',
      limit: '5',
    },
  };
  const res = createResponse();

  try {
    await bookController.listBooks(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { items: [], page: 3, limit: 5, totalItems: 0 });
  } finally {
    catalogService.searchCatalog = originalSearchCatalog;
  }
});
