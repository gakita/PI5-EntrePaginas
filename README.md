# Entre Páginas — Sistema de Recomendação de Leitura com IA

Projeto desenvolvido para a disciplina de Projeto Integrador V (PUC-Campinas). O sistema utiliza Inteligência Artificial (Google Gemini) para recomendar livros, HQs e mangás com base no perfil e preferências do usuário.

---

### 🗄️ Como conectar no banco de dados (Oracle SQL Developer)

1. **Baixe a extensão** ou o aplicativo Oracle SQL Developer.
2. **Adicione uma nova conexão** (nome ao seu critério).
3. **Username e Senha:** Disponíveis nos canais internos (Zap/Discord).
4. **Connection Type:** Selecione **Cloud Wallet**.
5. **Arquivo de Wallet:** Selecione o arquivo `Wallet_ProjetoIntegradorV.zip`.
   - ⚠️ **AVISO:** NUNCA suba este arquivo para o GitHub!
6. **Service:** Se solicitado, utilize a opção **HIGH**.

---

# Backend Node.js + Express com Oracle — Entre Páginas

Backend em JavaScript com Node.js + Express, autenticação via JWT, persistência no Oracle Database e chat de recomendação com IA usando Google Gemini.

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

### 4. Crie as tabelas do banco

```bash
npm run db:setup
```

Esse comando prepara as tabelas usadas pelo backend, incluindo chat, preferencias, sugestoes, favoritos, quiz e recuperacao de senha.

### 5. Inicie a aplicação completa

Para subir backend e frontend com um único comando, rode na raiz do projeto:

```bash
npm run dev:all
```

Esse comando inicia:

- backend em `http://localhost:3000`
- frontend em `http://localhost:3001`

Para encerrar os dois processos, use `Ctrl+C` no terminal.

### 6. Inicie apenas a API

```bash
npm run dev
```

### 7. Inicie apenas o frontend

```bash
cd frontend
npm run dev
```

### 8. Como rodar o Mailpit (SMTP de testes local)

O Mailpit captura todos os e-mails enviados pelo backend (recuperação de senha e confirmação de cadastro) sem precisar enviá-los de fato para caixas reais.

Você pode rodá-lo localmente de duas formas:

**Opção A: Usando Docker (Recomendado)**
```bash
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```

**Opção B: Instalação Manual (sem Docker)**
* **Windows (via Scoop)**: `scoop install mailpit` e depois execute `mailpit`
* **macOS (via Homebrew)**: `brew install mailpit` e depois execute `mailpit`
* **Download direto**: Baixe a versão correspondente ao seu sistema em [GitHub Releases](https://github.com/axllent/mailpit/releases), descompacte e execute o executável `mailpit`.

Após iniciar o Mailpit, acesse a interface web de leitura de e-mails em: [http://localhost:8025](http://localhost:8025).

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor em modo desenvolvimento |
| `npm run dev:all` | Inicia backend e frontend juntos, com logs prefixados |
| `npm start` | Inicia o servidor em modo produção |
| `npm run seed:user` | Cria/atualiza um usuário de teste no banco |
| `npm run db:setup` | Cria/verifica todas as tabelas principais do projeto |
| `npm run db:chat` | Cria a tabela `CONVERSAS` no Oracle |
| `npm run db:preferences` | Cria as tabelas `PREFERENCIAS_USUARIO`, `SUGESTOES_CONVERSA` e `FAVORITOS` |
| `npm run db:quiz` | Cria a tabela `QUIZ_SESSOES` no Oracle |
| `npm test` | Roda testes unitários com o runner nativo do Node.js |
| `npm run test:chat` | Roda todos os testes do chat (requer servidor no ar) |
| `npm run test:quiz` | Roda os cenários HTTP completos do quiz (requer servidor no ar) |
| `npm run test:quiz:run` | Cria/verifica tabela, sobe a API se necessário e roda os cenários do quiz |
| `npm run chat:play` | Inicia o chat interativo no terminal |
| `npm run screenshots` | Executa o script de automação Puppeteer para tirar as 15 capturas de tela de todas as funcionalidades para os slides de apresentação |

### Scripts do frontend

Rode os comandos abaixo dentro da pasta `frontend/`.

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o frontend em modo desenvolvimento |
| `npm run build` | Roda type-check e gera build de produção |
| `npm run type-check` | Valida tipos Vue/TypeScript |
| `npm run test` | Roda testes do frontend com Vitest |
| `npm run lint` | Roda ESLint |

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

### Como a autenticação funciona hoje

O projeto usa um JWT único, assinado com `JWT_SECRET` e expiração controlada por `JWT_EXPIRES_IN` (padrão: `1h`). Não há refresh token nesta versão.

No frontend, as rotas protegidas usam `meta.requiresAuth` no Vue Router. Usuários sem token são redirecionados para `/login`; usuários autenticados que tentam acessar rotas de visitante, como `/login` e `/registrar`, são redirecionados para `/`.

### Solicitar recuperacao de senha

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "joao@example.com"
}
```

Retorna sempre uma mensagem generica para nao revelar se o e-mail existe. Se o SMTP estiver configurado e o e-mail estiver cadastrado, envia um link/token para redefinir a senha.

Antes de usar, crie a tabela:

```bash
npm run db:password-reset
```

### Redefinir senha

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "TOKEN_RECEBIDO_NO_EMAIL",
  "newPassword": "novaSenha123"
}
```

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
      "categories": ["Comics & Graphic Novels"],
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
      "categories": [],
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
> Os campos `authors`, `categories`, `genres`, `coverUrl`, `synopsis`, `publishedDate`, `googleBooksId`, `previewLink`, `webReaderLink`, `embeddable` e `viewability` vêm do Google Books quando o volume é encontrado.

#### Testar metadados do Google Books

```http
GET /books/search?title=Duna&author=Frank%20Herbert
```

Essa rota simples consulta o Google Books pelo backend e retorna os mesmos campos usados para enriquecer as recomendações. Para testar visualmente, suba a API e abra:

```text
http://localhost:3000/google-books-test.html
```

Guias detalhados:

- `docs/requirements/README_GOOGLE_BOOKS.md`: funcionamento da integração no backend
- `docs/requirements/README_GOOGLE_BOOKS_FRONTEND.md`: como consumir esses campos no frontend

#### Categorias da home

```http
GET /books/categories
```

Retorna a lista curada usada no carrossel da home:

```json
[
  {
    "slug": "fantasia",
    "label": "Fantasia",
    "imageUrl": "/images/categories/generic-book.svg",
    "fallbackImageUrl": "/images/categories/generic-book.svg",
    "googleBooksQuery": "subject:fantasy"
  }
]
```

Fluxo recomendado para o frontend:

1. Buscar as categorias em `GET /books/categories`.
2. Para cada categoria, buscar um item em `GET /books?category=...&limit=1`.
3. Usar `coverUrl` do primeiro item como imagem do card.
4. Se `coverUrl` vier `null`, usar `fallbackImageUrl`.

#### Catalogo geral com filtros

```http
GET /books?search=harry%20potter&author=Rowling&category=fantasy&theme=magic&type=livro&page=1&limit=10
```

Essa rota consulta o Google Books, pagina os resultados e normaliza o payload para o frontend:

```json
{
  "items": [
    {
      "googleBooksId": "abc123",
      "title": "Harry Potter e a Pedra Filosofal",
      "author": "J.K. Rowling",
      "authors": ["J.K. Rowling"],
      "type": "livro",
      "categories": ["Fantasy / Wizards"],
      "genres": ["Fantasy"],
      "coverUrl": "https://books.google.com/books/content?id=abc123",
      "synopsis": "Um jovem bruxo descobre seu destino.",
      "publishedDate": "1997",
      "previewLink": "https://books.google.com/books?id=abc123",
      "webReaderLink": "https://play.google.com/books/reader?id=abc123",
      "embeddable": true,
      "viewability": "PARTIAL"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalItems": 42
}
```

O campo `type` e inferido pelo backend:

- `manga` quando houver indicios de manga
- `hq` quando houver indicios de comics / graphic novel / quadrinhos
- `livro` nos demais casos

#### Avaliacoes do usuario

As avaliacoes ficam no Oracle e sao vinculadas ao `googleBooksId` do item retornado pelo catalogo.

```http
GET /avaliacoes
Authorization: Bearer SEU_TOKEN
```

```http
POST /avaliacoes
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "googleBooksId": "abc123",
  "title": "Duna",
  "rating": 5,
  "comment": "Excelente."
}
```

O `POST /avaliacoes` faz upsert: atualiza a avaliacao se o usuario ja avaliou aquele `googleBooksId`, ou cria uma nova caso contrario.

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

Guia detalhado para o frontend: [README_QUIZ_FRONTEND.md](docs/requirements/README_QUIZ_FRONTEND.md).

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
| `JWT_EXPIRES_IN` | Tempo de expiração do token JWT unico usado pela API (padrao: `1h`) |
| `JSON_BODY_LIMIT` | Limite do body JSON aceito pelo Express (padrao: `10mb`) |
| `RATE_LIMIT_WINDOW_MS` | Janela do rate limit global em milissegundos (padrao: `900000`) |
| `RATE_LIMIT_MAX` | Maximo de requisicoes por janela no limite global (padrao: `300`) |
| `AUTH_RATE_LIMIT_MAX` | Maximo de requisicoes por janela nas rotas de autenticacao (padrao: `20`) |
| `ORACLE_USER` | Usuário do Oracle Database |
| `ORACLE_PASSWORD` | Senha do Oracle |
| `ORACLE_CONNECT_STRING` | String de conexão (do tnsnames.ora) |
| `ORACLE_CONFIG_DIR` | Caminho para a pasta do Wallet |
| `ORACLE_WALLET_LOCATION` | Caminho para a pasta do Wallet |
| `ORACLE_WALLET_PASSWORD` | Senha do Wallet |
| `GEMINI_API_KEY` | API Key do Google Gemini |
| `GEMINI_MODEL` | Modelo do Gemini (padrão: `gemini-2.5-flash-lite`) |
| `GOOGLE_BOOKS_API_KEY` | API Key da Google Books API (Opcional, usado para enriquecimento do catálogo com capa, autores, gêneros, sinopse e links de preview) |
| `SMTP_HOST` | Servidor SMTP para envio de recuperacao de senha |
| `SMTP_PORT` | Porta SMTP (padrao: `587`) |
| `SMTP_SECURE` | Use `true` para SMTP com TLS direto, geralmente porta `465` |
| `SMTP_USER` | Usuario da conta SMTP |
| `SMTP_PASS` | Senha/app password da conta SMTP |
| `MAIL_FROM` | Remetente exibido nos e-mails |
| `PASSWORD_RESET_FRONTEND_URL` | URL do frontend de redefinicao; o backend adiciona `?token=...` |
| `PASSWORD_RESET_TOKEN_MINUTES` | Tempo de validade do token (padrao: `30`) |
| `MAILPIT_HOST` | Endereço do Mailpit local (padrão: `127.0.0.1`) |
| `MAILPIT_PORT` | Porta SMTP do Mailpit local (padrão: `1025`) |
| `MAILPIT_ENABLED` | Ativa o envio duplicado para o Mailpit local (padrão: `true` no dev) |

---

## Segurança da API

O backend aplica os middlewares de segurança na inicialização do Express:

- `helmet()` para headers de segurança HTTP.
- `express-rate-limit` global para limitar volume de requisições.
- `express-rate-limit` específico nas rotas públicas de autenticação (`/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/send-code`, `/auth/verify-code`).
- `express.json({ limit: env.jsonBodyLimit })`, com limite padrão de `10mb`.

As configurações principais ficam nas variáveis `JSON_BODY_LIMIT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` e `AUTH_RATE_LIMIT_MAX`.

---

## Testes e Validação

### Backend

```bash
npm test
```

Esse comando roda os testes JavaScript em `test/*.test.js`, incluindo controllers, services, catálogo, quiz, segurança da API e o script `dev:all`.

### Frontend

```bash
cd frontend
npm run test
npm run type-check
npm run build
```

Os testes do frontend usam Vitest. O teste atual cobre o guard de autenticação do Vue Router.

---

## 📸 Automação de Capturas de Tela (Fotos dos Slides do TCC)

O sistema possui uma suíte de automação em **Puppeteer** desenvolvida especificamente para testar e capturar prints em alta definição de todas as páginas e fluxos do projeto. 

As imagens geradas são ideais para a elaboração de slides de apresentação de TCC e demonstração das funcionalidades.

### Como rodar a automação:
1. Certifique-se de que o backend e o frontend estão rodando em background (ou use o comando `npm run dev:all` na raiz do projeto).
2. Execute o comando de automação na raiz do projeto:
   ```bash
   npm run screenshots
   ```
3. O script irá:
   - Popular automaticamente o banco OracleDB com dados de teste.
   - Navegar programaticamente por todo o fluxo de cadastro passo-a-passo (RF09, RF11).
   - Efetuar o login.
   - Navegar pelas páginas de **Dashboard**, **Catálogo**, **Detalhes do Livro**, **Chatbot com IA** (enviando mensagem e revelando recomendações sensíveis!), **Quiz Adaptativo**, **Sugestões da IA** e **Favoritos**.
   - Gerar 15 arquivos de imagem em alta definição na pasta `/presentation_screenshots/` da raiz do seu projeto.

*(Nota: Esta pasta foi removida do `.gitignore` para que você possa commitar as capturas facilmente no seu Git e compartilhar com o grupo!).*

---

## 🛡️ Arquitetura de Catálogo Resiliente e Rota Proxy de Detalhes

Devido aos limites severos de requisições (**HTTP 429 - Too Many Requests**) aplicados pela API pública do Google Books no lado do cliente (navegador), implementamos uma arquitetura de resiliência multicamadas para garantir o funcionamento 100% ininterrupto do sistema:

1. **Catálogo Resiliente Local**: O backend possui uma lista curada de alta fidelidade de livros com múltiplos gêneros (Terror, Fantasia, Sci-Fi, Romance, HQs e Mangás). Se as chamadas externas falharem ou houver limitação de rede, o catálogo é servido a partir deste fallback estável de forma transparente.
2. **Proxy de Detalhes de Livro (`GET /books/:id`)**: Anteriormente, o frontend fazia requisições diretas à API pública do Google Books por ID para carregar a página de detalhes, o que resultava em falhas 404 para livros do catálogo de fallback ou telas pretas. Agora, a busca passa obrigatoriamente pela nossa API `/books/:id` do backend, que busca no Google (usando a cota do servidor) ou serve o fallback local mapeado.
3. **Imagens Resilientes via Unsplash**: Todas as capas de livros de fallback e favoritos usam URLs estéticas e estáveis hospedadas no Unsplash. Elas carregam instantaneamente no navegador do usuário, livre de rate limits ou erros de imagem quebrada (*"image not available"*).

---

## Pendências e Decisões de Escopo

Apesar de a base principal do backend e frontend estar implementada, os seguintes pontos ainda dependem de decisão de produto ou atualização de documentação externa:

1. **Carrossel de Banners/Categorias (RF05)**
   - A home atual não exibe o carrossel descrito no PDF. Isso foi tratado como decisão de design; reimplementar o RF05 deve ser uma tarefa separada.

2. **PDF do projeto**
   - O arquivo `Time_13_pdf-2.pdf` ainda precisa ser atualizado para refletir o código atual: Gemini padrão `gemini-2.5-flash-lite`, JWT único sem refresh token, comando `npm run db:setup`, tabela `FAVORITOS`, Helmet, rate limiting e payload `10mb`.

3. **Refresh token**
   - Não foi implementado nesta versão. O projeto usa JWT único com expiração por `JWT_EXPIRES_IN`, mantendo o fluxo de autenticação mais simples.
