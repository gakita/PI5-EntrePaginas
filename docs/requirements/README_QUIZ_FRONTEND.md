# Guia Frontend - Quiz Adaptativo Entre Paginas

Este guia explica como o frontend deve integrar o Quiz Adaptativo de Recomendacao com o backend.

O quiz atende ao RF10 do projeto:

- comeca com 3 perguntas genericas;
- depois a IA gera perguntas adaptativas;
- o usuario pode finalizar a partir de 3 respostas;
- o quiz nunca passa de 8 perguntas;
- ao finalizar, o backend infere preferencias e retorna recomendacoes enriquecidas.

---

## Visao Geral do Fluxo

```text
1. Usuario abre a tela do quiz
2. Frontend chama POST /quiz/start
3. Backend retorna sessionId + 3 perguntas genericas
4. Frontend exibe uma pergunta por vez
5. A cada resposta, frontend chama POST /quiz/answer
6. Backend salva a resposta e retorna a proxima pergunta
7. Depois da terceira resposta, a proxima pergunta pode vir da IA
8. Usuario clica em finalizar ou chega ao limite de 8 respostas
9. Frontend chama POST /quiz/finish
10. Backend retorna preferencias e recomendacoes
```

Importante: o frontend precisa guardar o `sessionId` retornado no `/quiz/start`. Ele sera usado em todas as chamadas seguintes.

---

## Autenticacao

Todas as rotas do quiz exigem JWT.

Enviar sempre:

```http
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

No frontend, normalmente o token vem do login e fica no `localStorage`.

Exemplo:

```javascript
function getAuthHeaders() {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
```

Se o token estiver ausente ou invalido, o backend retorna `401`.

---

## Endpoints

| Acao | Metodo | Endpoint | Quando chamar |
|---|---|---|---|
| Iniciar quiz | `POST` | `/quiz/start` | Quando o usuario abrir/iniciar o quiz |
| Responder pergunta | `POST` | `/quiz/answer` | Quando o usuario escolher uma opcao |
| Finalizar quiz | `POST` | `/quiz/finish` | Quando o usuario clicar em finalizar ou chegar ao limite |

Base URL em desenvolvimento:

```text
http://localhost:3000
```

---

## 1. Iniciar o Quiz

### Request

```http
POST /quiz/start
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

Body: pode enviar `{}` ou nenhum body.

### Response

```json
{
  "sessionId": "9f0b9a6e-0d7c-4b52-8d6a-1c9e7a4c6d3a",
  "maxQuestions": 8,
  "questions": [
    {
      "id": "preferred_type",
      "text": "Qual formato voce quer ler agora?",
      "options": ["Livro", "HQ", "Manga", "Tanto faz"]
    },
    {
      "id": "reading_mood",
      "text": "Que tipo de experiencia voce procura?",
      "options": ["Leve", "Emocionante", "Sombria", "Reflexiva"]
    },
    {
      "id": "favorite_theme",
      "text": "Qual tema chama mais sua atencao hoje?",
      "options": ["Fantasia", "Misterio", "Romance", "Ficcao cientifica"]
    }
  ],
  "questionNumber": 1,
  "canFinish": false
}
```

### O que o frontend deve fazer

Guardar:

- `sessionId`
- `questions`
- `maxQuestions`
- indice da pergunta atual
- respostas dadas pelo usuario, se quiser mostrar resumo local

Exemplo de estado:

```javascript
const quizState = {
  sessionId: null,
  questions: [],
  currentQuestionIndex: 0,
  answeredCount: 0,
  maxQuestions: 8,
  canFinish: false,
  isComplete: false,
  loading: false,
  error: null,
};
```

---

## 2. Responder uma Pergunta

### Request

```http
POST /quiz/answer
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json

{
  "sessionId": "9f0b9a6e-0d7c-4b52-8d6a-1c9e7a4c6d3a",
  "questionId": "preferred_type",
  "answer": "Manga"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `sessionId` | string | sim | ID retornado por `/quiz/start` |
| `questionId` | string | sim | ID da pergunta respondida |
| `answer` | string | sim | Opcao escolhida pelo usuario |

### Response com proxima pergunta

```json
{
  "sessionId": "9f0b9a6e-0d7c-4b52-8d6a-1c9e7a4c6d3a",
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

### Response quando chegou no limite

```json
{
  "sessionId": "9f0b9a6e-0d7c-4b52-8d6a-1c9e7a4c6d3a",
  "answeredCount": 8,
  "maxQuestions": 8,
  "question": null,
  "canFinish": true,
  "isComplete": true
}
```

### O que o frontend deve fazer

Depois de enviar a resposta:

- atualizar `answeredCount`;
- atualizar `canFinish`;
- atualizar `isComplete`;
- se `question` vier preenchido, adicionar a pergunta ao array local e exibir ela;
- se `question` vier `null`, mostrar botao/tela de finalizacao.

Regra pratica:

```javascript
if (data.question) {
  questions.value.push(data.question);
  currentQuestionIndex.value = questions.value.length - 1;
}

canFinish.value = data.canFinish;
isComplete.value = data.isComplete;
```

---

## 3. Finalizar o Quiz

### Request

```http
POST /quiz/finish
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json

{
  "sessionId": "9f0b9a6e-0d7c-4b52-8d6a-1c9e7a4c6d3a",
  "savePreferences": true
}
```

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `sessionId` | string | sim | ID do quiz ativo |
| `savePreferences` | boolean | nao | Se `true`, salva preferencias no perfil do usuario |

### Response

```json
{
  "message": "Aqui estao algumas recomendacoes baseadas no seu quiz.",
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
      "coverUrl": "https://books.google.com/books/content?id=...",
      "synopsis": "Sinopse resumida...",
      "publishedDate": "2021"
    }
  ],
  "preferencesSaved": true
}
```

### O que o frontend deve fazer

Exibir:

- `message` como texto introdutor;
- `preferences` como resumo do perfil identificado;
- `recommendations` como cards de recomendacao;
- um aviso se `preferencesSaved` for `true`.

---

## Estrutura dos Cards de Recomendacao

Cada item em `recommendations` pode ter:

| Campo | Tipo | Pode ser null? | Uso no frontend |
|---|---|---|---|
| `title` | string | nao | Titulo do card |
| `type` | string | pode | Livro, HQ, manga |
| `author` | string | pode | Autor |
| `justification` | string | pode | Motivo da recomendacao |
| `sensitiveContent` | boolean | nao | Exibir aviso de tema sensivel |
| `coverUrl` | string | sim | Capa da obra |
| `synopsis` | string | sim | Sinopse |
| `publishedDate` | string | sim | Ano/data de publicacao |

Tratamento recomendado:

```javascript
const cover = recommendation.coverUrl || '/placeholder-book.jpg';
const synopsis = recommendation.synopsis || 'Sinopse nao disponivel.';
```

Se `sensitiveContent === true`, o frontend deve exibir uma tag/aviso e pedir confirmacao antes de mostrar detalhes mais sensiveis.

Exemplo:

```vue
<span v-if="recommendation.sensitiveContent" class="sensitive-tag">
  Tema sensivel
</span>
```

---

## Servico Frontend Sugerido

Arquivo sugerido:

```text
src/services/quizService.js
```

Codigo:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || 'Erro ao comunicar com o servidor.';
    throw new Error(message);
  }

  return data;
}

export const quizService = {
  async startQuiz() {
    const response = await fetch(`${API_URL}/quiz/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });

    return parseResponse(response);
  },

  async answerQuestion({ sessionId, questionId, answer }) {
    const response = await fetch(`${API_URL}/quiz/answer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, questionId, answer }),
    });

    return parseResponse(response);
  },

  async finishQuiz({ sessionId, savePreferences = true }) {
    const response = await fetch(`${API_URL}/quiz/finish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, savePreferences }),
    });

    return parseResponse(response);
  },
};
```

---

## Exemplo de Composable Vue

Arquivo sugerido:

```text
src/composables/useQuiz.js
```

```javascript
import { computed, ref } from 'vue';
import { quizService } from '@/services/quizService';

export function useQuiz() {
  const sessionId = ref(null);
  const questions = ref([]);
  const currentQuestionIndex = ref(0);
  const answeredCount = ref(0);
  const maxQuestions = ref(8);
  const canFinish = ref(false);
  const isComplete = ref(false);
  const loading = ref(false);
  const error = ref(null);
  const result = ref(null);

  const currentQuestion = computed(() => {
    return questions.value[currentQuestionIndex.value] || null;
  });

  const progress = computed(() => {
    return Math.min(answeredCount.value, maxQuestions.value);
  });

  async function start() {
    loading.value = true;
    error.value = null;
    result.value = null;

    try {
      const data = await quizService.startQuiz();

      sessionId.value = data.sessionId;
      questions.value = data.questions || [];
      currentQuestionIndex.value = 0;
      answeredCount.value = 0;
      maxQuestions.value = data.maxQuestions || 8;
      canFinish.value = Boolean(data.canFinish);
      isComplete.value = false;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function answer(answerText) {
    if (!sessionId.value || !currentQuestion.value || loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await quizService.answerQuestion({
        sessionId: sessionId.value,
        questionId: currentQuestion.value.id,
        answer: answerText,
      });

      answeredCount.value = data.answeredCount;
      canFinish.value = data.canFinish;
      isComplete.value = data.isComplete;

      if (data.question) {
        questions.value.push(data.question);
        currentQuestionIndex.value = questions.value.length - 1;
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function finish(savePreferences = true) {
    if (!sessionId.value || loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      result.value = await quizService.finishQuiz({
        sessionId: sessionId.value,
        savePreferences,
      });
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  return {
    sessionId,
    questions,
    currentQuestion,
    currentQuestionIndex,
    answeredCount,
    maxQuestions,
    progress,
    canFinish,
    isComplete,
    loading,
    error,
    result,
    start,
    answer,
    finish,
  };
}
```

---

## Exemplo de Componente Vue

```vue
<template>
  <section class="quiz">
    <header>
      <h1>Quiz de leitura</h1>
      <p v-if="sessionId">{{ progress }} / {{ maxQuestions }}</p>
    </header>

    <button v-if="!sessionId && !result" type="button" @click="start" :disabled="loading">
      Iniciar quiz
    </button>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="currentQuestion && !result" class="question">
      <h2>{{ currentQuestion.text }}</h2>

      <div class="options">
        <button
          v-for="option in currentQuestion.options"
          :key="option"
          type="button"
          :disabled="loading"
          @click="answer(option)"
        >
          {{ option }}
        </button>
      </div>

      <button
        v-if="canFinish"
        type="button"
        :disabled="loading"
        @click="finish(true)"
      >
        Finalizar e salvar preferencias
      </button>
    </div>

    <div v-if="isComplete && !result" class="finish">
      <button type="button" :disabled="loading" @click="finish(true)">
        Ver recomendacoes
      </button>
    </div>

    <div v-if="result" class="result">
      <h2>Seu perfil</h2>
      <p>Generos: {{ result.preferences.genres.join(', ') || 'Nao identificado' }}</p>
      <p>Tipos: {{ result.preferences.types.join(', ') || 'Nao identificado' }}</p>

      <h2>Recomendacoes</h2>
      <article
        v-for="item in result.recommendations"
        :key="item.title"
        class="recommendation"
      >
        <img :src="item.coverUrl || '/placeholder-book.jpg'" :alt="item.title" />
        <h3>{{ item.title }}</h3>
        <p>{{ item.author }}</p>
        <span v-if="item.sensitiveContent">Tema sensivel</span>
        <p>{{ item.justification }}</p>
        <p>{{ item.synopsis || 'Sinopse nao disponivel.' }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { useQuiz } from '@/composables/useQuiz';

const {
  sessionId,
  currentQuestion,
  progress,
  maxQuestions,
  canFinish,
  isComplete,
  loading,
  error,
  result,
  start,
  answer,
  finish,
} = useQuiz();
</script>
```

---

## Estados que a Tela Deve Tratar

| Estado | Como identificar | UI recomendada |
|---|---|---|
| Nao iniciado | `sessionId === null` | Botao "Iniciar quiz" |
| Carregando | `loading === true` | Desabilitar botoes e mostrar loading |
| Pergunta ativa | `currentQuestion !== null` | Texto da pergunta + botoes de opcao |
| Pode finalizar | `canFinish === true` | Mostrar botao "Finalizar" |
| Limite atingido | `isComplete === true` | Forcar chamada de finalizacao |
| Finalizado | `result !== null` | Mostrar perfil e recomendacoes |
| Erro | `error !== null` | Mostrar mensagem amigavel |

---

## Tratamento de Erros

Possiveis respostas de erro:

| Status | Quando acontece | O que mostrar |
|---|---|---|
| `400` | Body incompleto, resposta vazia, finalizar cedo demais | "Verifique sua resposta e tente novamente." |
| `401` | Token ausente/invalido | Redirecionar para login |
| `404` | Sessao nao encontrada | Reiniciar quiz com `/quiz/start` |
| `409` | Quiz ja finalizado ou limite excedido | Mostrar resultado ou iniciar novo quiz |
| `500` | Erro interno | "Nao foi possivel concluir agora. Tente novamente." |

Exemplo:

```javascript
try {
  await answer(option);
} catch (err) {
  if (err.message.includes('Token')) {
    router.push('/login');
  }
}
```

---

## Regras Importantes para o Frontend

1. Nao chame `/quiz/answer` sem `sessionId`.
2. Nao permita clique duplo enquanto `loading` estiver ativo.
3. Sempre use o `questionId` da pergunta exibida.
4. Nao gere perguntas no frontend; quem decide a proxima pergunta e o backend.
5. A partir de `canFinish: true`, o usuario pode encerrar o quiz.
6. Se `isComplete: true`, finalize o quiz em seguida.
7. Use placeholder quando `coverUrl` vier `null`.
8. Mostre aviso visual quando `sensitiveContent` vier `true`.
9. Se `/quiz/start` for chamado de novo, a sessao ativa anterior e substituida.
10. `savePreferences: true` atualiza as preferencias do usuario no banco.

---

## Como Testar a Integracao

No backend:

```bash
npm run test:quiz:run -- --email=admin@example.com --password=123456
```

Se a API antiga estiver rodando e o comando reclamar de `/quiz/start` com 404:

```bash
# pare o servidor antigo com Ctrl+C
npm run dev
```

Depois rode novamente:

```bash
npm run test:quiz:run -- --skip-db --email=admin@example.com --password=123456
```

---

## Checklist para o Frontend

- [ ] Guardar token JWT depois do login.
- [ ] Criar `quizService`.
- [ ] Criar composable/store para estado do quiz.
- [ ] Chamar `/quiz/start` ao iniciar.
- [ ] Exibir uma pergunta por vez.
- [ ] Chamar `/quiz/answer` ao selecionar opcao.
- [ ] Exibir progresso `answeredCount / maxQuestions`.
- [ ] Habilitar finalizar quando `canFinish` for `true`.
- [ ] Chamar `/quiz/finish`.
- [ ] Renderizar preferencias inferidas.
- [ ] Renderizar cards de recomendacao.
- [ ] Tratar `sensitiveContent`.
- [ ] Tratar `coverUrl` e `synopsis` nulos.
- [ ] Tratar erros 400, 401, 404 e 409.
