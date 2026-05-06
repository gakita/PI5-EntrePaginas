# Google Books Catalog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build category, catalog, and evaluation APIs for the MVP using Google Books for browsing and Oracle for user evaluations.

**Architecture:** Extend the existing books module to expose a static categories endpoint and a paginated Google Books catalog endpoint. Add a dedicated evaluations module that stores user ratings keyed by `googleBooksId` in Oracle and leaves chat enrichment behavior intact.

**Tech Stack:** Node.js CommonJS, Express 5, Oracle Database through `oracledb`, Google Books HTTP API, Node's built-in test runner.

---

## Chunk 1: Categories And Catalog

### Task 1: Add failing tests for categories and catalog search

**Files:**
- Modify: `test/catalogService.test.js`
- Create: `test/bookController.test.js`

- [ ] Step 1: Write failing tests for static categories, Google Books query building, and normalized catalog responses.
- [ ] Step 2: Run `node --test test/catalogService.test.js test/bookController.test.js`.
- [ ] Step 3: Confirm failure points to missing behavior in `catalogService` and `bookController`.

### Task 2: Implement categories and catalog search

**Files:**
- Modify: `src/services/catalogService.js`
- Modify: `src/controllers/bookController.js`
- Modify: `src/routes/bookRoutes.js`

- [ ] Step 1: Add static category definitions and export a getter for them.
- [ ] Step 2: Add a Google Books catalog search function that maps filters to query syntax and normalizes paginated results.
- [ ] Step 3: Add `GET /categories` and `GET /books` while preserving `GET /books/search`.
- [ ] Step 4: Run `node --test test/catalogService.test.js test/bookController.test.js`.

## Chunk 2: Evaluations By Google Books ID

### Task 3: Add failing tests for evaluation upsert behavior

**Files:**
- Create: `test/avaliacaoModel.test.js`
- Create: `test/avaliacaoController.test.js`

- [ ] Step 1: Write failing tests for listing evaluations and upserting by user plus `googleBooksId`.
- [ ] Step 2: Run `node --test test/avaliacaoModel.test.js test/avaliacaoController.test.js`.
- [ ] Step 3: Confirm failure points to missing routes and model behavior.

### Task 4: Implement evaluation persistence and HTTP API

**Files:**
- Modify: `src/models/avaliacaoModel.js`
- Create: `src/controllers/avaliacaoController.js`
- Create: `src/routes/avaliacaoRoutes.js`
- Modify: `src/routes/index.js`
- Modify: `scripts/createAvaliacoesTable.js`

- [ ] Step 1: Refactor the Oracle model to read and upsert evaluations by authenticated user and `googleBooksId`.
- [ ] Step 2: Add authenticated `GET /avaliacoes` and `POST /avaliacoes`.
- [ ] Step 3: Update the table creation script to the new schema shape.
- [ ] Step 4: Run `node --test test/avaliacaoModel.test.js test/avaliacaoController.test.js`.

## Chunk 3: Verification And Docs

### Task 5: Document and verify

**Files:**
- Modify: `README.md`
- Modify: `README_GOOGLE_BOOKS_FRONTEND.md`

- [ ] Step 1: Document the new category, catalog, and evaluation endpoints.
- [ ] Step 2: Run `npm test`.
- [ ] Step 3: Run `node -c` on modified JS files.
- [ ] Step 4: Review `git diff` before reporting completion.
