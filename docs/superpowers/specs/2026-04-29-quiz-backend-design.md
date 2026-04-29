# Quiz Backend Design

Date: 2026-04-29
Project: Entre Paginas

## Context

The project already uses a layered Node.js backend with Express, Oracle Database, JWT auth, and Google Gemini. Existing chat functionality is split across routes, controllers, services, models, and integration services:

- `src/routes/*Routes.js`
- `src/controllers/*Controller.js`
- `src/services/*Service.js`
- `src/models/*Model.js`

The quiz must satisfy RF10 from `Time_13_pdf.pdf`: a guided quiz with objective questions that identifies reader preferences, recommends readings, can update preferences, and allows retaking the quiz. It should also align with RIA01-RIA05 by using preferences, structured JSON, explainable recommendations, catalog enrichment, and sensitive-content flags.

## Goals

- Add a protected backend API for an adaptive reading quiz.
- Start each quiz with 2-3 generic backend-defined questions.
- Let the LLM generate the next adaptive questions after the generic questions.
- Stop at a maximum of 8 questions.
- Allow the user to finish once enough answers exist.
- Infer reading preferences from quiz answers.
- Generate recommendations using the existing LLM and catalog enrichment flow.
- Optionally save inferred preferences to `PREFERENCIAS_USUARIO`.

## Non-Goals

- Build frontend quiz screens.
- Add a full analytics pipeline for quiz metrics.
- Replace the existing chat recommendation flow.
- Store complete long-term quiz history unless needed for the current active quiz session.

## Recommended Approach

Use a hybrid quiz:

1. The backend returns 3 fixed generic questions when the quiz starts.
2. The frontend sends answers one at a time.
3. After the generic questions are answered, the backend asks Gemini for the next best objective question.
4. The backend validates the LLM output and falls back to a safe fixed question if the LLM response is invalid.
5. The quiz ends when the user calls finish, or after 8 answered questions.
6. Finish infers preferences, optionally saves them, generates recommendations, enriches them through `catalogService`, and returns the result.

This preserves predictable startup behavior while still giving the quiz adaptive behavior.

## API Design

All routes require JWT auth through `authMiddleware`.

### `POST /quiz/start`

Starts or replaces the active quiz session for the authenticated user.

Response:

```json
{
  "sessionId": "generated-id",
  "maxQuestions": 8,
  "questions": [
    {
      "id": "preferred_type",
      "text": "Qual formato voce quer ler agora?",
      "options": ["Livro", "HQ", "Manga", "Tanto faz"]
    }
  ],
  "questionNumber": 1,
  "canFinish": false
}
```

### `POST /quiz/answer`

Records one answer and returns the next question when needed.

Request:

```json
{
  "sessionId": "generated-id",
  "questionId": "preferred_type",
  "answer": "Manga"
}
```

Response while quiz continues:

```json
{
  "sessionId": "generated-id",
  "answeredCount": 3,
  "maxQuestions": 8,
  "question": {
    "id": "ai_4",
    "text": "Voce prefere uma historia mais leve ou mais intensa?",
    "options": ["Leve", "Intensa", "Reflexiva", "Com muita acao"]
  },
  "canFinish": true,
  "isComplete": false
}
```

Response when the limit is reached:

```json
{
  "sessionId": "generated-id",
  "answeredCount": 8,
  "maxQuestions": 8,
  "question": null,
  "canFinish": true,
  "isComplete": true
}
```

### `POST /quiz/finish`

Finishes the quiz and returns inferred preferences plus recommendations.

Request:

```json
{
  "sessionId": "generated-id",
  "savePreferences": true
}
```

Response:

```json
{
  "preferences": {
    "genres": ["fantasia", "misterio"],
    "types": ["manga"],
    "favoriteAuthors": []
  },
  "recommendations": [
    {
      "title": "Frieren: Beyond Journey's End",
      "type": "manga",
      "author": "Kanehito Yamada",
      "justification": "Combina fantasia com um tom reflexivo.",
      "sensitiveContent": false,
      "coverUrl": null,
      "synopsis": null,
      "publishedDate": null
    }
  ],
  "preferencesSaved": true
}
```

## Components

### Routes

Create `src/routes/quizRoutes.js` and mount it in `src/routes/index.js` under `/quiz`.

### Controller

Create `src/controllers/quizController.js` with:

- `startQuiz(req, res, next)`
- `answerQuestion(req, res, next)`
- `finishQuiz(req, res, next)`

The controller validates required fields and delegates business logic to `quizService`.

### Service

Create `src/services/quizService.js` with:

- quiz session orchestration
- generic question definitions
- answer validation
- adaptive question generation through `llmService`
- finish behavior
- preference saving through `preferenceModel`
- fetching reading history through `avaliacaoModel`
- recommendation enrichment through `catalogService`

### Model

Create `src/models/quizModel.js` backed by Oracle table `QUIZ_SESSOES`.

The table stores only the active/current quiz session per user:

- `CODIGO`
- `SESSION_ID`
- `USUARIO_EMAIL`
- `PERGUNTAS` as CLOB JSON
- `RESPOSTAS` as CLOB JSON
- `FINALIZADO` as number
- `CRIADO_EM`
- `ATUALIZADO_EM`

Use an upsert-like pattern so `POST /quiz/start` replaces the previous active quiz for that user.

### LLM Service Additions

Extend `src/services/llmService.js` with:

- `generateQuizQuestion(questions, answers)`
- `finishQuizRecommendations(questions, answers, existingPreferences, readBooks)`
- optionally `inferQuizPreferences(questions, answers)`

The LLM must return JSON only. The service validates the shape before returning it.

## Data Flow

1. Frontend calls `POST /quiz/start`.
2. Backend creates a new session with 3 generic questions.
3. Frontend displays each generic question and calls `POST /quiz/answer`.
4. After the third answer, the backend calls the LLM for an adaptive question.
5. Steps continue until user finishes or 8 answers are reached.
6. Frontend calls `POST /quiz/finish`.
7. Backend infers preferences from answers.
8. Backend optionally saves preferences.
9. Backend generates and enriches recommendations.
10. Backend returns preferences and recommendations.

## Error Handling

- Missing auth: existing `authMiddleware` returns 401.
- Missing `sessionId`, `questionId`, or `answer`: return 400.
- Session not found or belongs to another user: return 404.
- Answer for unknown question: return 400.
- Quiz already finished: return 409.
- LLM unavailable: use fallback question while answering, or return a friendly empty recommendations result while finishing.
- Invalid LLM JSON: log a warning and use fallback behavior.

## Testing Strategy

Because the project currently has script-based tests instead of a test runner, add a script-style test similar to `scripts/testChat.js`:

- Login and get token.
- Start quiz successfully.
- Answer generic questions.
- Confirm adaptive question shape after generic questions.
- Finish quiz.
- Confirm recommendations array and preferences shape.
- Confirm validation errors for missing token and missing answer fields.

Service-level logic should be written so the LLM/catalog dependencies can be mocked later if the project adds Jest, Node test runner, or another test framework.

## Acceptance Criteria

- `POST /quiz/start` returns 2-3 generic objective questions.
- `POST /quiz/answer` stores answers for the authenticated user only.
- After generic questions, the backend asks the IA for the next question.
- The quiz never exceeds 8 questions.
- `POST /quiz/finish` returns inferred preferences and recommendations.
- Recommendations include title, type, author, justification, and `sensitiveContent`.
- Enriched recommendations include `coverUrl`, `synopsis`, and `publishedDate` fields when available.
- `savePreferences: true` updates `PREFERENCIAS_USUARIO` without duplicating existing values.
- All quiz routes require JWT auth.
