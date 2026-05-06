# Google Books Catalog Design

Date: 2026-05-06
Project: Entre Paginas

## Context

The backend already exposes `GET /books/search` to enrich a single title through Google Books. The home carousel and general catalog filters still do not exist as first-class backend APIs. The user decided to base the MVP catalog on Google Books instead of the local Oracle catalog and to keep user evaluations in Oracle.

## Goals

- Add a backend endpoint for home categories that does not depend on AI.
- Add a general catalog endpoint backed by Google Books.
- Keep response fields normalized for the frontend.
- Allow authenticated users to create and update evaluations for Google Books items.

## Non-Goals

- Replace chat recommendation flow.
- Build frontend screens.
- Migrate existing local Oracle catalog browsing logic.

## Recommended Approach

Use a split source-of-truth model:

1. Home categories are served from a static backend definition.
2. Catalog search and filtering are served from Google Books.
3. User evaluations remain in Oracle and are keyed by `googleBooksId`.

This keeps the catalog simple, avoids runtime dependence on local joins for browsing, and aligns the evaluation flow with the same IDs returned by the catalog.

## API Design

### `GET /categories`

Public route that returns curated categories for the home carousel.

Response:

```json
[
  {
    "slug": "fantasia",
    "label": "Fantasia",
    "imageUrl": "/images/categories/fantasia.png",
    "googleBooksQuery": "subject:fantasy"
  }
]
```

### `GET /books`

Public route that returns catalog results normalized from Google Books.

Accepted query params:

- `search`
- `author`
- `category`
- `theme`
- `type`
- `page`
- `limit`

Response:

```json
{
  "items": [
    {
      "googleBooksId": "abc123",
      "title": "Duna",
      "author": "Frank Herbert",
      "authors": ["Frank Herbert"],
      "type": "livro",
      "categories": ["Fiction / Science Fiction"],
      "genres": ["Fiction"],
      "coverUrl": "https://books.google.com/...",
      "synopsis": "Uma obra classica...",
      "publishedDate": "1965",
      "previewLink": "https://books.google.com/...",
      "webReaderLink": "https://play.google.com/...",
      "embeddable": true,
      "viewability": "PARTIAL"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalItems": 245
}
```

### `GET /avaliacoes`

Authenticated route that lists evaluations for the logged-in user.

### `POST /avaliacoes`

Authenticated upsert route keyed by `googleBooksId`.

Request:

```json
{
  "googleBooksId": "abc123",
  "title": "Duna",
  "rating": 5,
  "comment": "Excelente."
}
```

Response:

```json
{
  "googleBooksId": "abc123",
  "title": "Duna",
  "rating": 5,
  "comment": "Excelente."
}
```

## Data Model Changes

The current `AVALIACOES` table references `COD_LIVRO` from `FERNANDO.LIVROS`, which no longer matches the catalog source for the MVP. Replace that relation with a Google Books based shape:

- `CODIGO`
- `GOOGLE_BOOKS_ID`
- `TITULO`
- `NOTA`
- `COMENTARIO`
- `DT_AVALIACAO`
- `COD_USUARIO`

Keep one logical evaluation per user and Google Books item through backend upsert behavior.

## Components

- `src/routes/bookRoutes.js`
- `src/controllers/bookController.js`
- `src/services/catalogService.js`
- `src/routes/avaliacaoRoutes.js`
- `src/controllers/avaliacaoController.js`
- `src/models/avaliacaoModel.js`
- `scripts/createAvaliacoesTable.js`

## Testing

- Unit tests for category payload and Google Books query building.
- Unit tests for Google Books result normalization and pagination mapping.
- Unit tests for evaluation upsert behavior.
- Syntax and full test suite verification before completion.
