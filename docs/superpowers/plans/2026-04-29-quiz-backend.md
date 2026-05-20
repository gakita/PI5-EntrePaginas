# Quiz Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authenticated adaptive quiz backend described in `docs/superpowers/specs/2026-04-29-quiz-backend-design.md`.

**Architecture:** Add a `quiz` module following the existing Express layered pattern: route, controller, service, model, and script-style database setup. Reuse `llmService`, `catalogService`, `preferenceModel`, and `avaliacaoModel` for recommendation behavior.

**Tech Stack:** Node.js CommonJS, Express 5, Oracle Database through `oracledb`, Google Gemini via existing integration, Node's built-in test runner.

---

## Chunk 1: Deterministic Quiz Rules

### Task 1: Add test coverage for quiz rules

**Files:**
- Create: `test/quizService.test.js`
- Modify: `package.json`

- [ ] Write tests for generic questions, answer recording, max question limit, and fallback AI question validation.
- [ ] Run `node --test test/quizService.test.js` and confirm it fails because `src/services/quizService.js` does not exist.
- [ ] Add `npm test` script using `node --test`.

### Task 2: Implement quiz service deterministic helpers

**Files:**
- Create: `src/services/quizService.js`

- [ ] Implement constants for 3 generic questions and `MAX_QUESTIONS = 8`.
- [ ] Implement helpers to create sessions, record answers, decide completion, and validate/fallback AI questions.
- [ ] Export internal helpers under `_test` for Node tests.
- [ ] Run `npm test` and confirm deterministic tests pass.

## Chunk 2: Persistence And HTTP API

### Task 3: Add Oracle quiz model

**Files:**
- Create: `src/models/quizModel.js`
- Create: `scripts/createQuizTable.js`
- Modify: `package.json`

- [ ] Implement `QUIZ_SESSOES` CRUD functions for active sessions by user.
- [ ] Add a setup script that creates `QUIZ_SESSOES` and indexes.
- [ ] Add `db:quiz` script.

### Task 4: Add controller and routes

**Files:**
- Create: `src/controllers/quizController.js`
- Create: `src/routes/quizRoutes.js`
- Modify: `src/routes/index.js`

- [ ] Add `POST /quiz/start`, `POST /quiz/answer`, and `POST /quiz/finish`.
- [ ] Validate required request fields and return 400 for malformed requests.
- [ ] Mount routes under `/quiz` with `authMiddleware`.

## Chunk 3: AI Integration And Verification

### Task 5: Extend LLM service for quiz

**Files:**
- Modify: `src/services/llmService.js`

- [ ] Add `generateQuizQuestion`.
- [ ] Add `inferQuizPreferences`.
- [ ] Add `generateQuizRecommendations`.
- [ ] Keep JSON parsing defensive with fallback behavior.

### Task 6: Finish quiz orchestration

**Files:**
- Modify: `src/services/quizService.js`

- [ ] Connect service to `quizModel`, `llmService`, `preferenceModel`, `avaliacaoModel`, and `catalogService`.
- [ ] Make `finishQuiz` infer preferences, optionally save them, generate recommendations, enrich results, and mark the session finished.
- [ ] Return consistent response fields for frontend use.

### Task 7: Add manual integration script and docs

**Files:**
- Create: `scripts/testQuiz.js`
- Modify: `package.json`
- Modify: `README.md`

- [ ] Add `test:quiz` script similar to `test:chat`.
- [ ] Document quiz setup, endpoints, and manual test command.

### Task 8: Verify and commit

**Files:**
- All changed files.

- [ ] Run `npm test`.
- [ ] Run `node -c` on new/modified JS files if full HTTP test cannot run without Oracle/Gemini.
- [ ] Review `git diff`.
- [ ] Commit implementation.
