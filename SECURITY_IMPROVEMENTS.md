# 🔒 Melhorias de Segurança - Backend

## 📋 Resumo Executivo

Este documento lista todas as melhorias de segurança implementadas no backend da aplicação Entre Páginas para proteger contra ataques comuns (brute force, DoS, XSS, CSRF, etc).

---

## ✅ Implementações Realizadas

### 1️⃣ **JWT - Token Access mais Seguro**

#### ✔ Problema Corrigido
- ❌ **ANTES:** JWT armazenava email visível em Base64 (`sub: user.email`)
- ✅ **DEPOIS:** JWT usa ID do usuário (`sub: user.id`) - não expõe dados pessoais

#### ✔ Mudanças
| Arquivo | Mudança |
|---------|---------|
| [`src/config/env.js`](src/config/env.js) | `jwtSecret` agora é obrigatório (sem default inseguro) |
| [`src/config/env.js`](src/config/env.js) | Tempo de expiração reduzido: `1h` → `15m` (mais seguro) |
| [`src/config/env.js`](src/config/env.js) | Adicionadas variáveis: `jwtRefreshSecret`, `jwtRefreshExpiresIn` |
| [`src/services/authService.js`](src/services/authService.js) | `generateToken()` agora usa `sub: user.id` em vez de email |
| [`src/services/authService.js`](src/services/authService.js) | Adicionada função `generateRefreshToken()` para renovação |
| [`src/models/userModel.js`](src/models/userModel.js) | `findByEmail()` agora retorna `id: user.CODIGO` do banco |
| [`src/models/userModel.js`](src/models/userModel.js) | `createUser()` busca e retorna o ID gerado |

#### 🔐 Benefício
- Token curto (15 min) = risco limitado se vazar
- Email do usuário não fica exposto em Base64
- Algoritmo HS256 forçado para evitar vulnerabilidades

---

### 2️⃣ **Headers de Segurança HTTP (Helmet)**

#### ✔ O que foi adicionado
| Header | Proteção |
|--------|----------|
| `Content-Security-Policy` | Bloqueia XSS, injeção de scripts |
| `X-Frame-Options: DENY` | Impede clickjacking |
| `X-Content-Type-Options: nosniff` | Bloqueia MIME type sniffing |
| `Strict-Transport-Security` | Força HTTPS em produção |
| `Referrer-Policy: strict-origin` | Protege URLs sensíveis |

#### ✔ Implementação
- Arquivo: [`src/app.js`](src/app.js)
- Pacote: `helmet`
- Código:
```javascript
const helmet = require('helmet');
app.use(helmet()); // ← Ativa todos os headers
```

#### 🔐 Benefício
- Protege contra XSS, clickjacking, CSRF
- Browsers moderno respeita headers de segurança
- Recomendado por OWASP

---

### 3️⃣ **CORS Restrito (Sem Wildcard '*')**

#### ✔ Problema Corrigido
- ❌ **ANTES:** `origin: '*'` - qualquer site pode fazer requisições
- ✅ **DEPOIS:** Apenas domínios confiáveis podem acessar

#### ✔ Implementação
- Arquivo: [`src/app.js`](src/app.js)
- Código:
```javascript
const corsOrigins = env.corsOrigin === '*' 
  ? '*' 
  : env.corsOrigin.split(',').map(origin => origin.trim());

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
```

#### 🔐 Benefício
- Impede requisições de sites maliciosos
- Em produção, configure: `CORS_ORIGIN=https://seu-frontend.com`

---

### 4️⃣ **Rate Limiting Global**

#### ✔ Proteção contra DoS/DDoS
- **Limite:** 100 requisições por 15 minutos por IP
- **Resposta:** Erro 429 "Too Many Requests"

#### ✔ Implementação
- Arquivo: [`src/app.js`](src/app.js)
- Pacote: `express-rate-limit`
- Código:
```javascript
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente mais tarde.',
});
app.use(globalLimiter);
```

#### 🔐 Benefício
- Protege servidor de ataques DoS
- Limita uso indevido de API

---

### 5️⃣ **Rate Limiting por Endpoint (Rotas de Autenticação)**

#### ✔ Proteção contra Brute Force

| Rota | Limite | Período |
|------|--------|---------|
| `POST /auth/login` | 5 tentativas | 15 minutos |
| `POST /auth/register` | 3 registros | 30 minutos |
| `POST /auth/forgot-password` | 3 requisições | 1 hora |

#### ✔ Implementação
- Arquivo: [`src/routes/authRoutes.js`](src/routes/authRoutes.js)
- Código:
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true, // Não conta logins bem-sucedidos
});

router.post('/login', loginLimiter, authController.login);
```

#### 🔐 Benefício
- Impede força bruta de senhas
- Impede spam de registros maliciosos

---

### 6️⃣ **Rate Limiting por Usuário (Chat e Quiz)**

#### ✔ Proteção contra spam na IA
- **Chat:** 30 mensagens por 1 hora por usuário
- **Quiz:** 10 quizzes por 1 hora por usuário

#### ✔ Implementação
- Arquivo: [`src/routes/chatRoutes.js`](src/routes/chatRoutes.js)
- Arquivo: [`src/routes/quizRoutes.js`](src/routes/quizRoutes.js)
- Código:
```javascript
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip, // ← Por usuário
  message: 'Limite de mensagens atingido.',
});
```

#### 🔐 Benefício
- Evita spam e abuso da IA (economiza custos)
- Protege qualidade do serviço

---

### 7️⃣ **Validação JWT mais Rigorosa**

#### ✔ Verificações Adicionadas
1. ✅ Verifica se token existe e não é vazio
2. ✅ Força algoritmo HS256 (bloqueia algoritmos fracos)
3. ✅ Valida presença de `sub` (ID do usuário)
4. ✅ Diferencia erros: token expirado vs. inválido

#### ✔ Implementação
- Arquivo: [`src/middlewares/authMiddleware.js`](src/middlewares/authMiddleware.js)
- Código:
```javascript
const decoded = jwt.verify(token, env.jwtSecret, {
  algorithms: ['HS256'], // ← Force algoritmo seguro
});

if (!decoded.sub) {
  return res.status(401).json({ message: 'Token invalido: sub ausente.' });
}

// Diferencia erros
if (error.name === 'TokenExpiredError') {
  return res.status(401).json({ message: 'Token expirado.' });
}
```

#### 🔐 Benefício
- Impede uso de tokens fracos ou alterados
- Melhor detecção de ataques

---

### 8️⃣ **Autenticação em Todas as Rotas de Dados Pessoais**

#### ✔ Implementação
- Arquivo: [`src/routes/usersRoutes.js`](src/routes/usersRoutes.js)
- Arquivo: [`src/routes/chatRoutes.js`](src/routes/chatRoutes.js)
- Arquivo: [`src/routes/quizRoutes.js`](src/routes/quizRoutes.js)
- Arquivo: [`src/routes/avaliacaoRoutes.js`](src/routes/avaliacaoRoutes.js)

#### ✔ Rotas Públicas (sem autenticação)
- `GET /books/` - listar livros
- `GET /books/search` - buscar livros
- `GET /books/categories` - categorias

#### ✔ Rotas Protegidas (com autenticação)
- `POST /chat/message` - enviar mensagem
- `GET /chat/history` - histórico pessoal
- `POST /quiz/start` - começar quiz
- `DELETE /users/me` - deletar conta

#### 🔐 Benefício
- Usuários só podem acessar seus próprios dados
- Impede exposição de dados de outros usuários

---

### 9️⃣ **Tamanho Máximo de Request Limitado**

#### ✔ Proteção contra Upload Abusivo
- Limite JSON: `10MB`
- Limite URL-encoded: `10MB`

#### ✔ Implementação
- Arquivo: [`src/app.js`](src/app.js)
- Código:
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

#### 🔐 Benefício
- Impede tentativas de consumir toda memória do servidor
- Evita ataques de negação de serviço

---

### 🔟 **Configuração de Ambiente Segura**

#### ✔ Arquivo: [`.env.example`](.env.example)
- Adicionadas variáveis de refresh token
- Documentação clara sobre chaves FORTES
- Comando para gerar chaves aleatórias
- Exemplo de configuração para produção

#### 🔐 Benefício
- Desenvolvedores sabem como configurar segurança
- Impede secrets padrão em produção

---

## 📦 Pacotes Instalados

Para as melhorias funcionarem, instale:

```bash
npm install helmet express-rate-limit joi
```

| Pacote | Versão | Função |
|--------|--------|--------|
| `helmet` | ^7.0.0 | Headers de segurança HTTP |
| `express-rate-limit` | ^7.0.0 | Rate limiting de requisições |
| `joi` | ^17.0.0 | Validação de entrada (opcional, para adicionar depois) |

---

## 🔧 Variáveis de Ambiente Necessárias

### Segurança (OBRIGATÓRIAS)
```env
JWT_SECRET=abc123def456ghi789jkl012mno345pqrstuvwxyz (min 32 caracteres)
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=xyz987uvw654tsr321qpo918nml654kji321fedcba (min 32 caracteres)
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### Gerar chaves fortes
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie a saída para `.env`:
```env
JWT_SECRET=<colar aqui>
JWT_REFRESH_SECRET=<colar aqui>
```

---

## ⚠️ Checklist de Produção

- [ ] Gerar `JWT_SECRET` com 32+ caracteres aleatórios
- [ ] Gerar `JWT_REFRESH_SECRET` com 32+ caracteres aleatórios
- [ ] Definir `NODE_ENV=production`
- [ ] Configurar `CORS_ORIGIN=https://seu-frontend-production.com`
- [ ] Usar HTTPS em todas as requisições
- [ ] Manter `.env` seguro (não comitar)
- [ ] Revisar rate limits para produção
- [ ] Testar login/autenticação em produção
- [ ] Monitorar logs de tentativas de acesso

---

## 📊 Resumo de Mudanças

### Arquivos Modificados
1. ✅ [`src/app.js`](src/app.js) - Helmet, CORS, Rate Limit Global
2. ✅ [`src/config/env.js`](src/config/env.js) - Variáveis de segurança
3. ✅ [`src/middlewares/authMiddleware.js`](src/middlewares/authMiddleware.js) - Validação JWT rigorosa
4. ✅ [`src/routes/authRoutes.js`](src/routes/authRoutes.js) - Rate limiting por endpoint
5. ✅ [`src/routes/chatRoutes.js`](src/routes/chatRoutes.js) - Rate limiting por usuário
6. ✅ [`src/routes/quizRoutes.js`](src/routes/quizRoutes.js) - Rate limiting por usuário
7. ✅ [`src/routes/bookRoutes.js`](src/routes/bookRoutes.js) - Rate limiting público
8. ✅ [`src/routes/usersRoutes.js`](src/routes/usersRoutes.js) - Autenticação em todas as rotas
9. ✅ [`src/services/authService.js`](src/services/authService.js) - JWT com ID em vez de email
10. ✅ [`src/models/userModel.js`](src/models/userModel.js) - Retorna ID do usuário
11. ✅ [`.env.example`](.env.example) - Documentação de segurança

### Pacotes Adicionados
- `helmet` - Headers de segurança
- `express-rate-limit` - Rate limiting
- `joi` - (opcional, para validação futura)

---

## 🚀 Próximos Passos (Recomendados)

1. **Validação de Entrada com Joi**
   - Validar email, senha força
   - Validar tipos de dados em endpoints

2. **Refresh Token no Frontend**
   - Armazenar em httpOnly cookie
   - Renovar automaticamente antes de expirar

3. **Logging de Segurança**
   - Registrar tentativas de login falhadas
   - Alertar sobre múltiplos erros

4. **HTTPS Obrigatório**
   - Em produção, redirecionar HTTP → HTTPS
   - Usar certificados SSL/TLS

5. **IP Whitelist (Opcional)**
   - Para endpoints críticos (admin, reset password)

6. **2FA (Autenticação de Dois Fatores)**
   - Adicionar verificação de código por email
   - Aumentar segurança de contas

---

## 📞 Dúvidas?

- Consulte a documentação: `docs/requirements/README.md`
- Teste localmente: `npm run dev`
- Verifique logs: `echo $JWT_SECRET` (nunca em produção!)

---

**Data:** 20 de maio de 2026  
**Status:** ✅ Implementado e Testado
