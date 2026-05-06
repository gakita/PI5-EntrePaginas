# Google Books Viewer Test Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich recommended books with Google Books metadata and provide a simple test page showing cover, title, authors, genres, synopsis, and preview links.

**Architecture:** Keep Gemini responsible for recommendations and `catalogService` responsible for catalog metadata. Add a small unauthenticated test endpoint/page for manual Google Books lookup without involving the chat or Oracle.

**Tech Stack:** Node.js, Express, native `node:test`, Google Books Volumes API, Google Books Embedded Viewer script.

---

## Chunk 1: Catalog Metadata

### Task 1: Enrich Google Books Fields

**Files:**
- Modify: `src/services/catalogService.js`
- Test: `test/catalogService.test.js`

- [ ] **Step 1: Write failing test**

Verify `enrichRecommendations` maps Google Books volume fields to `title`, `authors`, `genres`, `synopsis`, `coverUrl`, `publishedDate`, `googleBooksId`, `previewLink`, `webReaderLink`, `embeddable`, and `viewability`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/catalogService.test.js`

- [ ] **Step 3: Implement metadata mapping**

Update `catalogService` to read `volumeInfo` and `accessInfo`, normalize HTTPS image links, keep original recommendation fields, and provide null/empty fallbacks.

- [ ] **Step 4: Run focused and full tests**

Run: `node --test test/catalogService.test.js` and `npm test`.

## Chunk 2: Test Page

### Task 2: Add Minimal Manual Test Page

**Files:**
- Create: `public/google-books-test.html`
- Modify: `src/app.js`
- Modify: `README.md`

- [ ] **Step 1: Add static page**

Create a simple HTML page with inputs for title/author, a result area with cover and metadata, and Google Books Embedded Viewer fallback when embeddable.

- [ ] **Step 2: Serve static files**

Add `express.static('public')` in `src/app.js`.

- [ ] **Step 3: Document usage**

Document `/google-books-test.html` and returned recommendation fields in `README.md`.

- [ ] **Step 4: Run verification**

Run `npm test` and start the server to confirm the route is available.
