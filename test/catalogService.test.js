const test = require('node:test');
const assert = require('node:assert/strict');

const catalogService = require('../src/services/catalogService');

test('enriches recommendations with Google Books metadata and viewer fields', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    assert.ok(url.includes('q=Duna%20Frank%20Herbert'));
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
                categories: ['Fiction', 'Science Fiction'],
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
    assert.deepEqual(recommendation.genres, ['Fiction', 'Science Fiction']);
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
