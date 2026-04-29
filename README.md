# Backend Node.js + Express com Oracle — Entre Páginas

Backend em JavaScript com Node.js + Express, autenticação via JWT, persistência no Oracle Database e chat de recomendação com IA usando Google Gemini.

---

## Requisitos

- Node.js 18+ instalado
- Wallet do Oracle Autonomous Database disponível localmente (descompactada)
- Arquivo `.env` configurado a partir de `.env.example`

---

## Como rodar

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o arquivo `.env`

```bash
cp .env.example .env
```

No PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Preencha o `.env` com os valores reais. O `.env.example` pode ficar no GitHub como modelo — o `.env` fica só na sua máquina.

### 3. Descompacte o Oracle Wallet

O Wallet precisa estar em uma **pasta**, não em `.zip`:

```bash
cd secrets/oracle-wallet
unzip Wallet_ProjetoIntegradorV.zip -d Wallet_ProjetoIntegradorV
```

### 4. Crie a tabela do chat no banco

```bash
npm run db:chat
```

### 5. Inicie a API

```bash
npm run dev
```

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor em modo desenvolvimento |
| `npm start` | Inicia o servidor em modo produção |
| `npm run seed:user` | Cria/atualiza um usuário de teste no banco |
| `npm run db:chat` | Cria a tabela `CONVERSAS` no Oracle |
| `npm run db:preferences` | Cria as tabelas `PREFERENCIAS_USUARIO` e `SUGESTOES_CONVERSA` |
| `npm run db:quiz` | Cria a tabela `QUIZ_SESSOES` no Oracle |
| `npm test` | Roda testes unitários com o runner nativo do Node.js |
| `npm run test:chat` | Roda todos os testes do chat (requer servidor no ar) |
| `npm run test:quiz` | Roda os cenários HTTP completos do quiz (requer servidor no ar) |
| `npm run test:quiz:run` | Cria/verifica tabela, sobe a API se necessário e roda os cenários do quiz |
| `npm run chat:play` | Inicia o chat interativo no terminal |

---

## Inserir usuário de teste

```bash
npm run seed:user -- --email=admin@example.com --password=123456
```

O script faz `MERGE`, então atualiza a senha se o email já existir.

---

## Endpoints de Autenticação

### Cadastrar usuário

```http
POST /auth/register
Content-Type: application/json

{
  "name": "João",
  "email": "joao@example.com",
  "password": "123456"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "123456"
}
```

Retorna um `token` JWT. Use ele no header `Authorization: Bearer <token>` em todas as rotas protegidas.

### Rota protegida (verificar token)

```http
GET /auth/me
Authorization: Bearer SEU_TOKEN
```

---

## Chat de Recomendação com IA

O chat usa o **Google Gemini** para recomendar livros, HQs e mangás. Todas as rotas exigem autenticação JWT.

### Fluxo geral

```
Usuário envia mensagem
    → Backend monta contexto (histórico + preferências + livros lidos da tabela AVALIACOES)
    → Gemini gera recomendações em JSON
    → Backend salva a conversa no Oracle
    → Retorna resposta + lista de recomendações
```

### Endpoints do Chat

#### Enviar mensagem

```http
POST /chat/message
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "message": "Me recomenda um mangá de fantasia!"
}
```

**Resposta:**

```json
{
  "reply": "Claro! Aqui vão algumas sugestões incríveis de mangá de fantasia:",
  "recommendations": [
    {
      "title": "Fullmetal Alchemist",
      "type": "mangá",
      "author": "Hiromu Arakawa",
      "authors": ["Hiromu Arakawa"],
      "genres": ["Comics & Graphic Novels"],
      "justification": "Uma história épica com alquimia, aventura e profundidade emocional.",
      "sensitiveContent": true,
      "coverUrl": "https://books.google.com/books/content?id=...",
      "synopsis": "Neste mundo existem alquimistas, pessoas que estudam e realizam a arte da transmutação...",
      "publishedDate": "2014",
      "googleBooksId": "abc123",
      "previewLink": "https://books.google.com/books?id=abc123",
      "webReaderLink": "https://play.google.com/books/reader?id=abc123",
      "embeddable": true,
      "viewability": "PARTIAL"
    },
    {
      "title": "Frieren: Beyond Journey's End",
      "type": "mangá",
      "author": "Kanehito Yamada",
      "authors": [],
      "genres": [],
      "justification": "Uma fantasia reflexiva e emocionante sobre o tempo e memória.",
      "sensitiveContent": false,
      "coverUrl": null,
      "synopsis": null,
      "publishedDate": null,
      "googleBooksId": null,
      "previewLink": null,
      "webReaderLink": null,
      "embeddable": false,
      "viewability": null
    }
  ],
  "messageCount": 2
}
```

> O campo `sensitiveContent: true` indica que o item tem temas sensíveis (violência, saúde mental, etc.) — use isso no frontend para exibir um aviso de confirmação (RF11).
> Os campos `authors`, `genres`, `coverUrl`, `synopsis`, `publishedDate`, `googleBooksId`, `previewLink`, `webReaderLink`, `embeddable` e `viewability` vêm do Google Books quando o volume é encontrado.

#### Testar metadados do Google Books

```http
GET /books/search?title=Duna&author=Frank%20Herbert
```

Essa rota simples consulta o Google Books pelo backend e retorna os mesmos campos usados para enriquecer as recomendações. Para testar visualmente, suba a API e abra:

```text
http://localhost:3000/google-books-test.html
```

#### Buscar histórico da conversa

```http
GET /chat/history
Authorization: Bearer SEU_TOKEN
```

**Resposta:**

```json
{
  "messages": [
    { "role": "user",      "content": "Me recomenda um mangá de fantasia!", "timestamp": "2026-04-28T19:00:00.000Z" },
    { "role": "assistant", "content": "Claro! Aqui vão algumas sugestões...", "timestamp": "2026-04-28T19:00:03.000Z" }
  ]
}
```

#### Limpar histórico (iniciar nova conversa)

```http
DELETE /chat/history
Authorization: Bearer SEU_TOKEN
```

**Resposta:**

```json
{ "message": "Historico do chat limpo com sucesso." }
```

#### Encerrar Conversa (Salvar Histórico)

O fluxo ideal não é apenas limpar o chat, mas **encerrá-lo**. Isso faz a IA analisar as mensagens trocadas, inferir os gostos do usuário e salvar essas preferências no banco. Também guarda o histórico de obras que foram sugeridas.

```http
POST /chat/close
Authorization: Bearer SEU_TOKEN
```

**Resposta:**

```json
{
  "message": "Conversa encerrada e dados salvos com sucesso.",
  "suggestionsSaved": 3,
  "preferencesUpdated": {
    "genres": ["fantasia", "ficção científica"],
    "types": ["mangá", "livro"],
    "favoriteAuthors": ["Hiromu Arakawa"]
  }
}
```

#### Buscar e Atualizar Preferências

As preferências do usuário (usadas para personalizar o chat) podem ser buscadas ou atualizadas manualmente pelo frontend (ex: na tela de Configurações do perfil).

```http
GET /chat/preferences
Authorization: Bearer SEU_TOKEN
```

**Resposta:**

```json
{
  "genres": ["fantasia", "terror"],
  "types": ["livro"],
  "favoriteAuthors": ["Stephen King"]
}
```

```http
PUT /chat/preferences
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "genres": ["romance"],
  "types": ["hq", "livro"],
  "favoriteAuthors": ["Jane Austen"]
}
```

---

## Quiz Adaptativo de Recomendação

O quiz atende ao RF10: começa com perguntas objetivas genéricas e, depois das respostas iniciais, usa a IA para criar perguntas adaptativas até o limite de 8 perguntas. Todas as rotas exigem autenticação JWT.

Guia detalhado para o frontend: [README_QUIZ_FRONTEND.md](README_QUIZ_FRONTEND.md).

Antes de usar o quiz, crie a tabela:

```bash
npm run db:quiz
```

### Fluxo geral

```
Frontend inicia o quiz
    → Backend cria 3 perguntas genéricas
    → Usuário responde uma por vez
    → IA gera próximas perguntas adaptativas
    → Usuário finaliza
    → Backend infere preferências, salva opcionalmente, cruza com histórico de leitura (AVALIACOES) e retorna recomendações enriquecidas
```

### Iniciar quiz

```http
POST /quiz/start
Authorization: Bearer SEU_TOKEN
```

**Resposta:**

```json
{
  "sessionId": "9f0b9a6e-0d7c-4b52-8d6a-1c9e7a4c6d3a",
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

### Responder pergunta

```http
POST /quiz/answer
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "sessionId": "9f0b9a6e-0d7c-4b52-8d6a-1c9e7a4c6d3a",
  "questionId": "preferred_type",
  "answer": "Manga"
}
```

Depois da terceira resposta, o backend passa a retornar uma pergunta adaptativa gerada pela IA.

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

### Finalizar quiz

```http
POST /quiz/finish
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "sessionId": "9f0b9a6e-0d7c-4b52-8d6a-1c9e7a4c6d3a",
  "savePreferences": true
}
```

**Resposta:**

```json
{
  "message": "Aqui estao algumas recomendacoes baseadas no seu quiz.",
  "preferences": {
    "genres": ["fantasia", "misterio"],
    "types": ["manga"],
    "favoriteAuthors": []
  },
  "recommendations": [],
  "preferencesSaved": true
}
```

### Testar o Quiz

Com o servidor rodando (`npm run dev` em outro terminal), execute:

```bash
npm run test:quiz -- --email=admin@example.com --password=123456
```

Para executar o fluxo completo em um comando, incluindo `db:quiz` e subida automática da API quando ela não estiver rodando:

```bash
npm run test:quiz:run -- --email=admin@example.com --password=123456
```

Se a tabela já existir e você quiser pular a etapa de banco:

```bash
npm run test:quiz:run -- --skip-db --email=admin@example.com --password=123456
```

---

## Testar o Chat

Com o servidor rodando (`npm run dev` em outro terminal), execute:

```bash
npm run test:chat -- --email=admin@example.com --password=123456
```

Isso roda **7 cenários** automaticamente:

| Cenário | O que testa |
|---|---|
| 1 | Login e obtenção do token JWT |
| 2 | Enviar mensagem e receber recomendações da IA |
| 3 | Conversa com múltiplas mensagens (contexto) |
| 4 | Buscar histórico salvo no banco Oracle |
| 5 | Limpar histórico |
| 6 | Nova conversa após limpeza |
| 7 | Erros de validação (mensagem vazia, sem token, token inválido) |

---

## Implementação no Frontend (Vue.js)

### 1. Serviço de Chat (`src/services/chatService.js`)

Crie um arquivo de serviço para centralizar todas as chamadas à API:

```javascript
// src/services/chatService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Retorna o token JWT salvo no localStorage após o login.
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Envia uma mensagem para o chat e retorna a resposta da IA.
 * @param {string} message - Texto digitado pelo usuário.
 * @returns {Promise<{ reply: string, recommendations: Array }>}
 */
export async function sendMessage(message) {
  const response = await fetch(`${API_URL}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) throw new Error('Erro ao enviar mensagem');
  return response.json();
}

/**
 * Busca o histórico da última conversa do usuário.
 * @returns {Promise<{ messages: Array }>}
 */
export async function getHistory() {
  const response = await fetch(`${API_URL}/chat/history`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });

  if (!response.ok) throw new Error('Erro ao buscar histórico');
  return response.json();
}

/**
 * Limpa o histórico do chat (inicia uma nova conversa).
 */
export async function clearHistory() {
  const response = await fetch(`${API_URL}/chat/history`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });

  if (!response.ok) throw new Error('Erro ao limpar histórico');
  return response.json();
}
```

### 2. Componente de Chat (`src/components/ChatBox.vue`)

```vue
<!-- src/components/ChatBox.vue -->
<template>
  <div class="chat-box">
    <!-- Histórico de mensagens -->
    <div class="messages" ref="messagesContainer">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role]"
      >
        <p>{{ msg.content }}</p>
      </div>

      <!-- Indicador de carregamento enquanto aguarda a IA -->
      <div v-if="isLoading" class="message assistant loading">
        <p>Pensando...</p>
      </div>
    </div>

    <!-- Cards de recomendação -->
    <div v-if="recommendations.length > 0" class="recommendations">
      <div
        v-for="rec in recommendations"
        :key="rec.title"
        class="rec-card"
      >
        <!-- Aviso de tema sensível (RF11) -->
        <span v-if="rec.sensitiveContent" class="sensitive-tag">
          ⚠️ Tema sensível
        </span>
        <h4>{{ rec.title }}</h4>
        <p class="rec-type">{{ rec.type }} • {{ rec.author }}</p>
        <p class="rec-justification">{{ rec.justification }}</p>
      </div>
    </div>

    <!-- Input de mensagem -->
    <form @submit.prevent="handleSend" class="input-area">
      <input
        v-model="inputText"
        placeholder="Peça uma recomendação de leitura..."
        :disabled="isLoading"
      />
      <button type="submit" :disabled="isLoading || !inputText.trim()">
        Enviar
      </button>
      <button type="button" @click="handleClear">
        Nova conversa
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { sendMessage, getHistory, clearHistory } from '@/services/chatService';

const messages = ref([]);
const recommendations = ref([]);
const inputText = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);

// Carrega o histórico ao montar o componente
onMounted(async () => {
  const { messages: history } = await getHistory();
  messages.value = history;
  scrollToBottom();
});

// Rola o chat para a última mensagem
async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// Envia mensagem e exibe resposta da IA
async function handleSend() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  // Adiciona mensagem do usuário na tela imediatamente
  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  recommendations.value = [];
  isLoading.value = true;
  scrollToBottom();

  try {
    const result = await sendMessage(text);

    // Adiciona resposta da IA
    messages.value.push({ role: 'assistant', content: result.reply });
    recommendations.value = result.recommendations;
  } catch (error) {
    messages.value.push({ role: 'assistant', content: 'Erro ao conectar com a IA. Tente novamente.' });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
}

// Limpa a conversa
async function handleClear() {
  await clearHistory();
  messages.value = [];
  recommendations.value = [];
}
</script>
```

### 3. Variável de Ambiente no Frontend

Crie um arquivo `.env` na raiz do projeto Vue com:

```
VITE_API_URL=http://localhost:3000
```

Em produção, troque pelo endereço real do backend.

---

## Variáveis de Ambiente do Backend

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão: 3000) |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `JWT_EXPIRES_IN` | Tempo de expiração do token (ex: `1h`) |
| `ORACLE_USER` | Usuário do Oracle Database |
| `ORACLE_PASSWORD` | Senha do Oracle |
| `ORACLE_CONNECT_STRING` | String de conexão (do tnsnames.ora) |
| `ORACLE_CONFIG_DIR` | Caminho para a pasta do Wallet |
| `ORACLE_WALLET_LOCATION` | Caminho para a pasta do Wallet |
| `ORACLE_WALLET_PASSWORD` | Senha do Wallet |
| `GEMINI_API_KEY` | API Key do Google Gemini |
| `GEMINI_MODEL` | Modelo do Gemini (padrão: `gemini-2.5-flash-lite`) |
| `GOOGLE_BOOKS_API_KEY` | API Key da Google Books API (Opcional, usado para enriquecimento do catálogo com capa, autores, gêneros, sinopse e links de preview) |
