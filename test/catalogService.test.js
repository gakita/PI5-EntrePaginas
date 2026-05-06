const test = require('node:test');
const assert = require('node:assert/strict');

const env = require('../src/config/env');
const catalogService = require('../src/services/catalogService');

test('returns curated home categories for the carousel', () => {
  const categories = catalogService.getHomeCategories();

  assert.ok(Array.isArray(categories));
  assert.ok(categories.length >= 5);
  assert.deepEqual(categories[0], {
    slug: 'fantasia',
    label: 'Fantasia',
    imageUrl: '/images/categories/generic-book.svg',
    fallbackImageUrl: '/images/categories/generic-book.svg',
    googleBooksQuery: 'subject:fantasy',
  });
});

test('searches Google Books catalog with normalized filters and paginated response', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    assert.ok(url.includes('/volumes?q='));
    assert.ok(url.includes(encodeURIComponent('harry potter')));
    assert.ok(url.includes(encodeURIComponent('inauthor:"J.K. Rowling"')));
    assert.ok(url.includes(encodeURIComponent('subject:fantasy')));
    assert.ok(url.includes(encodeURIComponent('subject:magic')));
    assert.ok(url.includes('startIndex=10'));
    assert.ok(url.includes('maxResults=10'));

    return {
      ok: true,
      async json() {
        return {
          totalItems: 42,
          items: [
            {
              id: 'book-1',
              volumeInfo: {
                title: 'Harry Potter e a Pedra Filosofal',
                authors: ['J.K. Rowling'],
                categories: ['Fantasy / Wizards'],
                description: 'Um jovem bruxo descobre seu destino.',
                publishedDate: '1997',
                previewLink: 'http://books.google.com/books?id=book-1',
                imageLinks: {
                  thumbnail: 'http://books.google.com/books/content?id=book-1',
                },
              },
              accessInfo: {
                embeddable: true,
                viewability: 'PARTIAL',
                webReaderLink: 'http://play.google.com/books/reader?id=book-1',
              },
            },
          ],
        };
      },
    };
  };

  try {
    const result = await catalogService.searchCatalog({
      search: 'harry potter',
      author: 'J.K. Rowling',
      category: 'fantasy',
      theme: 'magic',
      page: 2,
      limit: 10,
    });

    assert.equal(result.page, 2);
    assert.equal(result.limit, 10);
    assert.equal(result.totalItems, 42);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].googleBooksId, 'book-1');
    assert.equal(result.items[0].title, 'Harry Potter e a Pedra Filosofal');
    assert.equal(result.items[0].author, 'J.K. Rowling');
    assert.equal(result.items[0].type, 'livro');
    assert.deepEqual(result.items[0].authors, ['J.K. Rowling']);
    assert.deepEqual(result.items[0].categories, ['Fantasy / Wizards']);
    assert.deepEqual(result.items[0].genres, ['Fantasy']);
    assert.equal(result.items[0].coverUrl, 'https://books.google.com/books/content?id=book-1');
    assert.equal(result.items[0].previewLink, 'https://books.google.com/books?id=book-1');
    assert.equal(result.items[0].webReaderLink, 'https://play.google.com/books/reader?id=book-1');
  } finally {
    global.fetch = originalFetch;
  }
});

test('enriches recommendations with Google Books metadata and viewer fields', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    assert.ok(url.includes('q=intitle%3A%22Duna%22%20inauthor%3A%22Frank%20Herbert%22'));
    assert.ok(url.includes('maxResults=1'));

    return {
      ok: true,
      async json() {
        return {
          items: [
            {
              id: 'abc123',
              volumeInfo: {
                title: 'Duna',
                authors: ['Frank Herbert'],
                categories: ['Fiction / Science Fiction / Space Opera', 'Literary Criticism'],
                description: 'Uma obra classica de ficcao cientifica.',
                publishedDate: '1965',
                previewLink: 'http://books.google.com/books?id=abc123',
                imageLinks: {
                  thumbnail: 'http://books.google.com/books/content?id=abc123&printsec=frontcover&img=1',
                },
              },
              accessInfo: {
                embeddable: true,
                viewability: 'PARTIAL',
                webReaderLink: 'http://play.google.com/books/reader?id=abc123',
              },
            },
          ],
        };
      },
    };
  };

  try {
    const [recommendation] = await catalogService.enrichRecommendations([
      {
        title: 'Duna',
        author: 'Frank Herbert',
        type: 'livro',
        justification: 'Boa ficcao politica.',
        sensitiveContent: false,
      },
    ]);

    assert.equal(recommendation.title, 'Duna');
    assert.deepEqual(recommendation.authors, ['Frank Herbert']);
    assert.equal(recommendation.author, 'Frank Herbert');
    assert.deepEqual(recommendation.categories, ['Fiction / Science Fiction / Space Opera', 'Literary Criticism']);
    assert.deepEqual(recommendation.genres, ['Fiction', 'Literary Criticism']);
    assert.equal(Object.prototype.hasOwnProperty.call(recommendation, 'subgenres'), false);
    assert.equal(recommendation.synopsis, 'Uma obra classica de ficcao cientifica.');
    assert.equal(
      recommendation.coverUrl,
      'https://books.google.com/books/content?id=abc123&printsec=frontcover&img=1'
    );
    assert.equal(recommendation.publishedDate, '1965');
    assert.equal(recommendation.googleBooksId, 'abc123');
    assert.equal(recommendation.previewLink, 'https://books.google.com/books?id=abc123');
    assert.equal(recommendation.webReaderLink, 'https://play.google.com/books/reader?id=abc123');
    assert.equal(recommendation.embeddable, true);
    assert.equal(recommendation.viewability, 'PARTIAL');
  } finally {
    global.fetch = originalFetch;
  }
});

test('retries Google Books search without API key when key is rejected', async () => {
  const originalFetch = global.fetch;
  const originalKey = env.googleBooksApiKey;
  const urls = [];

  env.googleBooksApiKey = 'rejected-key';

  global.fetch = async (url) => {
    urls.push(url);

    if (urls.length === 1) {
      return { ok: false, status: 503 };
    }

    return {
      ok: true,
      async json() {
        return {
          items: [
            {
              id: 'fallback123',
              volumeInfo: {
                title: 'Duna',
                authors: ['Frank Herbert'],
                imageLinks: {
                  thumbnail: 'http://books.google.com/books/content?id=fallback123',
                },
              },
              accessInfo: {
                embeddable: false,
                viewability: 'NO_PAGES',
              },
            },
          ],
        };
      },
    };
  };

  try {
    const [recommendation] = await catalogService.enrichRecommendations([
      { title: 'Duna', author: 'Frank Herbert' },
    ]);

    assert.equal(urls.length, 2);
    assert.ok(urls[0].includes('&key=rejected-key'));
    assert.equal(urls[1].includes('&key='), false);
    assert.ok(urls[1].includes('q=intitle%3A%22Duna%22%20inauthor%3A%22Frank%20Herbert%22'));
    assert.equal(recommendation.googleBooksId, 'fallback123');
    assert.equal(recommendation.coverUrl, 'https://books.google.com/books/content?id=fallback123');
  } finally {
    global.fetch = originalFetch;
    env.googleBooksApiKey = originalKey;
  }
});
