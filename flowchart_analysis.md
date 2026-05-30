# 🗺️ Fluxograma — Projeto Entre Páginas (branch `main`)

## Arquitetura Geral

```mermaid
flowchart TB
    subgraph USER["👤 Usuário"]
        U[Browser]
    end

    subgraph FE["🖥️ Frontend — Vue.js 3 + Vite + Vuetify 4"]
        subgraph PAGES["Páginas (12)"]
            HOME[home.vue] 
            LOGIN[Login.vue]
            REG[Register.vue]
            FORGOT[ForgotPassword.vue]
            RESET[ResetPassword.vue]
            CAT[Catalogo.vue]
            BOOK[BookDescPage.vue]
            CHAT[Chatbot.vue]
            QUIZ[Quiz.vue]
            FAV[Favorites.vue]
            REC[Recommendations.vue]
            PROF[Profile.vue]
        end
        ROUTER["Router (11 rotas ativas)"]
        GUARDS[guards.ts]
        AUTH_STORE[authStore — Pinia]
        FE_SVC["services/index.ts<br/>authService, chatService,<br/>quizService, booksService,<br/>favoritesService, evaluationsService,<br/>bookService, catalogService"]
    end

    subgraph BE["⚙️ Backend — Node.js + Express 5"]
        subgraph ROUTES["Rotas (8 módulos)"]
            R_AUTH[authRoutes — 9 endpoints]
            R_CHAT[chatRoutes — 8 endpoints]
            R_QUIZ[quizRoutes — 4 endpoints]
            R_BOOK[bookRoutes — 3 endpoints]
            R_AVAL[avaliacaoRoutes — 2 endpoints]
            R_FAV[favoriteRoutes — 3 endpoints]
            R_USER[usersRoutes — 1 endpoint]
            R_HEALTH[GET /health]
        end
        subgraph CTRL["Controllers (6)"]
            C_AUTH[authController]
            C_CHAT[chatController]
            C_QUIZ[quizController]
            C_BOOK[bookController]
            C_AVAL[avaliacaoController]
            C_FAV[favoriteController]
        end
        subgraph SVC["Services (6)"]
            S_AUTH[authService]
            S_CHAT[chatService]
            S_QUIZ[quizService]
            S_CAT[catalogService]
            S_LLM[llmService]
            S_EMAIL[emailService]
        end
        subgraph MDL["Models (8)"]
            M_USER[userModel]
            M_CHAT[chatModel]
            M_QUIZ[quizModel]
            M_PREF[preferenceModel]
            M_SUGG[suggestionModel]
            M_AVAL[avaliacaoModel]
            M_PWD[passwordResetTokenModel]
            M_FAV[favoriteModel]
        end
        MW["Middlewares: authMiddleware, errorHandler, notFound"]
    end

    subgraph EXT["☁️ Serviços Externos"]
        ORACLE[("Oracle Autonomous DB<br/>8 tabelas")]
        GEMINI["Google Gemini API"]
        GBOOKS["Google Books API"]
        OLIB["Open Library API"]
        SMTP["SMTP Server"]
    end

    U --> PAGES
    PAGES --> ROUTER --> GUARDS --> AUTH_STORE
    PAGES --> FE_SVC -->|"HTTP /api"| ROUTES
    PAGES -->|"Direct fetch"| GBOOKS
    PAGES -->|"Direct fetch"| OLIB

    ROUTES --> MW --> CTRL --> SVC --> MDL --> ORACLE
    S_LLM --> GEMINI
    S_CAT --> GBOOKS
    S_EMAIL --> SMTP
```

---

## Fluxos do Usuário

```mermaid
flowchart LR
    subgraph AUTH["🔐 Autenticação"]
        A1[Register.vue] -->|POST /auth/register| A2[authService.register]
        A2 --> A3[bcrypt hash + JWT]
        B1[Login.vue] -->|POST /auth/login| B2[authService.login]
        B2 --> B3[JWT token → authStore]
        C1[ForgotPassword.vue] -->|POST /auth/forgot-password| C2[emailService → SMTP]
        C2 --> C3[ResetPassword.vue]
        C3 -->|POST /auth/reset-password| C4[Atualiza senha]
    end
```

```mermaid
flowchart LR
    subgraph CHAT["💬 Chat IA"]
        D1[Chatbot.vue] -->|GET /chat/history| D2[Carrega conversa]
        D2 --> D3[POST /chat/message]
        D3 --> D4["llmService → Gemini"]
        D4 --> D5["catalogService → Google Books"]
        D5 --> D6[Retorna recomendações]
        D6 -->|Encerrar| D7[POST /chat/close]
        D7 --> D8["IA infere preferências + salva sugestões"]
    end
```

```mermaid
flowchart LR
    subgraph QUIZF["🧠 Quiz Adaptativo"]
        E1[Quiz.vue] -->|POST /quiz/start| E2[Sessão + 3 perguntas genéricas]
        E2 --> E3[POST /quiz/answer]
        E3 -->|"≥3ª pergunta"| E4["Gemini gera pergunta dinâmica"]
        E4 --> E3
        E3 -->|"8 perguntas"| E5[POST /quiz/finish]
        E5 --> E6["Recomendações + preferências salvas"]
    end
```

```mermaid
flowchart LR
    subgraph CATF["📚 Catálogo + Livro"]
        F1[Catalogo.vue] -->|"booksService.listBooks()"| F2["Google Books API<br/>(fallback: Open Library)"]
        F2 --> F3[BookCoversGrid + FiltersPanel]
        F3 -->|Clica livro| F4[BookDescPage.vue]
        F4 -->|"booksService.getBookById()"| F5["Detalhes completos"]
        F4 -->|"favoritesService.add/remove"| F6[POST/DELETE /favorites]
        F4 -->|"evaluationsService.upsert"| F7[POST /avaliacoes]
    end
```

---

## Diagrama ER (Banco Oracle)

```mermaid
erDiagram
    USUARIOS_TESTE {
        NUMBER ID PK
        VARCHAR2 NOME
        VARCHAR2 EMAIL UK
        VARCHAR2 SENHA
        DATE DATA_CRIACAO
    }
    CONVERSAS {
        NUMBER ID PK
        VARCHAR2 EMAIL UK
        CLOB MESSAGES_JSON
        TIMESTAMP UPDATED_AT
    }
    PREFERENCIAS_USUARIO {
        NUMBER ID PK
        VARCHAR2 EMAIL UK
        CLOB PREFERENCES_JSON
        TIMESTAMP UPDATED_AT
    }
    SUGESTOES_CONVERSA {
        NUMBER ID PK
        VARCHAR2 TITULO
        VARCHAR2 AUTOR
        CLOB JUSTIFICATIVA
        NUMBER SENSITIVE_CONTENT
    }
    QUIZ_SESSOES {
        VARCHAR2 SESSION_ID PK
        VARCHAR2 EMAIL
        CLOB SESSION_JSON
    }
    AVALIACOES {
        NUMBER ID PK
        VARCHAR2 EMAIL
        VARCHAR2 GOOGLE_BOOKS_ID
        NUMBER RATING
    }
    PASSWORD_RESET_TOKENS {
        NUMBER ID PK
        VARCHAR2 EMAIL
        VARCHAR2 TOKEN_HASH
        TIMESTAMP EXPIRES_AT
    }
    FAVORITOS {
        NUMBER ID PK
        VARCHAR2 EMAIL
        VARCHAR2 GOOGLE_BOOKS_ID
        VARCHAR2 TITULO
    }
    USUARIOS_TESTE ||--o{ CONVERSAS : email
    USUARIOS_TESTE ||--o| PREFERENCIAS_USUARIO : email
    USUARIOS_TESTE ||--o{ QUIZ_SESSOES : email
    USUARIOS_TESTE ||--o{ AVALIACOES : email
    USUARIOS_TESTE ||--o{ PASSWORD_RESET_TOKENS : email
    USUARIOS_TESTE ||--o{ FAVORITOS : email
```

---

## ✅ Análise de Conexões Frontend ↔ Backend

| Funcionalidade | Frontend (Página) | Frontend (Service) | Backend (Rota) | Conectada? |
|---|---|---|---|---|
| Cadastro | Register.vue | `authService.register()` | POST /auth/register | ✅ |
| Login | Login.vue | `authService.login()` | POST /auth/login | ✅ |
| Esqueceu senha | ForgotPassword.vue | `authService.forgotPassword()` | POST /auth/forgot-password | ✅ |
| Redefinir senha | ResetPassword.vue | `authService.resetPassword()` | POST /auth/reset-password | ✅ |
| Verificação e-mail | Register.vue | `authService.sendCode/verifyCode()` | POST /auth/send-code, verify-code | ✅ |
| Perfil (ver/editar/deletar) | Profile.vue | `authService.me/updateMe/deleteMe()` | GET/PATCH/DELETE /auth/me | ✅ |
| Chat IA | Chatbot.vue | `chatService.*()` | POST/GET/DELETE /chat/* | ✅ |
| Preferências | Profile.vue | `chatService.getPreferences/update/clear()` | GET/PUT/DELETE /chat/preferences | ✅ |
| Sugestões salvas | Recommendations.vue | `chatService.getSuggestions()` | GET /chat/suggestions | ✅ |
| Quiz | Quiz.vue | `quizService.start/answer/regenerate/finish()` | POST /quiz/* | ✅ |
| Catálogo | Catalogo.vue | `booksService.listBooks()` | **Direto Google Books/Open Library** | ✅ (sem backend) |
| Detalhes livro | BookDescPage.vue | `booksService.getBookById()` | **Direto Google Books/Open Library** | ✅ (sem backend) |
| Favoritos | Favorites.vue | `favoritesService.*()` | GET/POST/DELETE /favorites | ✅ |
| Avaliações | BookDescPage.vue | `evaluationsService.*()` | GET/POST /avaliacoes | ✅ |
| Home → Quiz | home.vue | `router.push('/quiz')` | — | ✅ |
| Home → Chat | home.vue | `router.push(chatbotRoute)` | — | ✅ |
| Home → Search+Chat | home.vue | `startNewConversation()` | — | ✅ |
| Backend catálogo | — | `bookService.list()` | GET /books | ⚠️ Existe mas não é usado |

---

## 🚨 O que falta implementar

> [!WARNING]
> Problemas encontrados no código da `main`:

| # | Item | Detalhe | Severidade |
|---|------|---------|------------|
| 1 | **Auth bypass ativo** | `guards.ts` L11: `const bypassAuth = true` — **pula toda autenticação** | 🔴 Crítico |
| 2 | **Rota /preferencias** | Comentada no router (L72-76), mas funcionalidade existe dentro de Profile.vue | ⚠️ Baixo |
| 3 | **Rota /historico** | Comentada no router (L77-80), sem página implementada | ⚠️ Baixo |
| 4 | **Helmet** | PDF menciona implementado — **não existe** no package.json nem app.js | 🔴 PDF incorreto |
| 5 | **Rate Limiting** | PDF menciona 3 níveis — **não existe** no código | 🔴 PDF incorreto |
| 6 | **Payload 10MB** | PDF menciona — `express.json()` usa default (100kb) | ⚠️ PDF incorreto |
| 7 | **Refresh Token** | PDF menciona 7 dias — **não implementado** | ⚠️ PDF incorreto |
| 8 | **Carrossel Home** | PDF (RF05) descreve carrossel de categorias — **removido** na home atual | ⚠️ Design choice |

---

## 📋 Verificação PDF vs Código Real

### ✅ Informações CORRETAS no PDF
| Item | PDF | Código | ✅ |
|------|-----|--------|---|
| Vue.js 3 | 3.5.30 | `"vue": "^3.5.30"` | ✅ |
| Pinia | 3.0.4 | `"pinia": "^3.0.4"` | ✅ |
| Vue Router | 5.0.3 | `"vue-router": "^5.0.3"` | ✅ |
| Vuetify 4 | 4.0.2 | `"vuetify": "^4.0.2"` | ✅ |
| Tailwind CSS | 4.2.1 | `"tailwindcss": "^4.2.1"` | ✅ |
| Vite | 8.0.0 | `"vite": "^8.0.0"` | ✅ |
| Express.js 5 | 5.1.0 | `"express": "^5.1.0"` | ✅ |
| @google/generative-ai | 0.24.1 | `"^0.24.1"` | ✅ |
| bcrypt | 6.0.0 | `"^6.0.0"` | ✅ |
| jsonwebtoken | 9.0.2 | `"^9.0.2"` | ✅ |
| nodemailer | 8.0.7 | `"^8.0.7"` | ✅ |
| oracledb | 6.9.0 | `"^6.9.0"` | ✅ |
| nodemon | 3.1.14 | `"^3.1.14"` | ✅ |
| Pool conexões | min 1, max 5 | env.js: `POOL_MIN=1, POOL_MAX=5` | ✅ |
| CORS restrito | Variáveis env | `cors({ origin: env.corsOrigin })` | ✅ |
| 7 tabelas | Listadas no PDF | 8 models (7+favoritos) | ✅ (PDF desatualizado, há +1) |
| Fontes | Roboto, Playfair Display | package.json do frontend | ✅ |

### ⚠️ Informações DIVERGENTES no PDF
| Item | PDF diz | Código real | Status |
|------|---------|-------------|--------|
| Modelo Gemini | `gemini-1.5-flash / gemini-2.0-flash` | `gemini-2.5-flash-lite` (env.js L24) | ⚠️ Divergente |
| JWT expiração | `15 min + Refresh Token 7 dias` | Default `1h`, sem refresh token | ⚠️ Divergente |
| `npm run db:init` | Script unificado | `npm run db:setup` (nome diferente) | ⚠️ Nome diferente |
| Tabelas no banco | 7 tabelas | 8 tabelas (+ FAVORITOS) | ⚠️ PDF desatualizado |

### ❌ Ausentes no código (PDF afirma existir)
| Item | PDF afirma | Realidade |
|------|-----------|-----------|
| **Helmet** | Headers de segurança implementados | Não instalado, não usado |
| **Rate Limiting** | 3 níveis (global, brute force, por usuário) | Não existe |
| **Payload 10MB** | Limite configurado | Usa default Express (100kb) |

---

## 📊 Resumo Final

### ✅ O que está BEM na `main`
- **12 páginas no frontend** (vs 5 na branch anterior) — todas as principais implementadas
- **8 módulos de rotas** no backend com **30+ endpoints**
- **Frontend services completos**: auth, chat, quiz, books, favorites, evaluations — **todos conectados**
- **Integração dupla de catálogo**: Google Books + Open Library como fallback
- **Fluxo completo**: registro → verificação email → login → home → chat/quiz/catálogo → perfil
- **8 models** cobrindo todas as entidades do banco

### 🔴 Itens críticos para corrigir
1. **Remover `bypassAuth = true`** em `guards.ts` antes de produção
2. **Atualizar o PDF**: modelo Gemini, JWT, tabela FAVORITOS, remover menções a Helmet/Rate Limiting ou implementá-los
3. **Implementar Helmet + Rate Limiting** se quiser manter as afirmações do PDF
