# Banco de Dados

Este documento resume como o backend usa o Oracle hoje, quais tabelas sao locais do projeto, quais tabelas externas do schema `FERNANDO` sao lidas, e quais scripts devem ser executados para preparar o ambiente.

## Visao geral

O projeto usa duas fontes de dados:

- Tabelas do proprio backend, criadas pelos scripts em `scripts/`
- Tabelas ja existentes no schema `FERNANDO`, usadas como apoio

Hoje o catalogo principal do MVP vem do Google Books. O Oracle continua sendo usado para autenticacao, historico, preferencias, quiz, recuperacao de senha e avaliacoes do usuario.

## Tabelas externas do schema `FERNANDO`

Essas tabelas nao sao criadas pelo backend:

- `FERNANDO.USUARIOS_TESTE`
  - Usada para cadastro, login e ligacao das avaliacoes ao usuario.
  - Colunas observadas no projeto: `CODIGO`, `NOME`, `EMAIL`, `SENHA`, `DT_CRIACAO`.

- `FERNANDO.LIVROS`
  - Era usada como catalogo local e ainda aparece em scripts antigos e no backfill de avaliacoes.
  - Nao e mais a fonte principal do catalogo do MVP.

- `FERNANDO.AUTORES`
- `FERNANDO.GENEROS`
- `FERNANDO.SUBGENEROS`
  - Foram usadas no levantamento do catalogo local antigo.

## Tabelas locais do backend

### `CONVERSAS`

Criada por:

```bash
npm run db:chat
```

Responsabilidade:

- Armazena o historico JSON da conversa por usuario.

Colunas principais:

- `CODIGO`
- `USUARIO_EMAIL`
- `MENSAGENS`
- `CRIADO_EM`
- `ATUALIZADO_EM`

Indice:

- `IDX_CONV_USUARIO` unico em `USUARIO_EMAIL`

### `PREFERENCIAS_USUARIO`

Criada por:

```bash
npm run db:preferences
```

Responsabilidade:

- Guarda preferencias inferidas ou editadas manualmente.

Colunas principais:

- `CODIGO`
- `USUARIO_EMAIL`
- `GENEROS` em CLOB JSON
- `TIPOS` em CLOB JSON
- `AUTORES_FAVORITOS` em CLOB JSON
- `ATUALIZADO_EM`

Indice:

- `IDX_PREF_USUARIO` unico em `USUARIO_EMAIL`

### `SUGESTOES_CONVERSA`

Criada por:

```bash
npm run db:preferences
```

Responsabilidade:

- Guarda as obras sugeridas nas conversas encerradas.

Colunas principais:

- `CODIGO`
- `USUARIO_EMAIL`
- `TITULO`
- `TIPO`
- `AUTOR`
- `JUSTIFICATIVA`
- `TEMA_SENSIVEL`
- `CAPA_URL`
- `SINOPSE`
- `CRIADO_EM`

Indice:

- `IDX_SUG_USUARIO` em `USUARIO_EMAIL`

### `QUIZ_SESSOES`

Criada por:

```bash
npm run db:quiz
```

Responsabilidade:

- Mantem a sessao ativa do quiz por usuario.

Colunas principais:

- `CODIGO`
- `SESSION_ID`
- `USUARIO_EMAIL`
- `MAX_PERGUNTAS`
- `PERGUNTAS` em CLOB JSON
- `RESPOSTAS` em CLOB JSON
- `FINALIZADO`
- `CRIADO_EM`
- `ATUALIZADO_EM`

Indices:

- `IDX_QUIZ_USUARIO` unico em `USUARIO_EMAIL`
- `IDX_QUIZ_SESSION` em `SESSION_ID`

### `PASSWORD_RESET_TOKENS`

Criada por:

```bash
npm run db:password-reset
```

Responsabilidade:

- Guarda tokens hash de recuperacao de senha.

Colunas principais:

- `CODIGO`
- `EMAIL`
- `TOKEN_HASH`
- `EXPIRES_AT`
- `USED_AT`
- `CREATED_AT`

Indices:

- `IDX_PWD_RESET_TOKEN_HASH` unico em `TOKEN_HASH`
- `IDX_PWD_RESET_EMAIL` em `EMAIL`

### `AVALIACOES`

Criada ou migrada por:

```bash
node scripts/createAvaliacoesTable.js
```

Responsabilidade:

- Guarda a avaliacao do usuario para itens do Google Books.

Schema atual esperado:

- `CODIGO`
- `GOOGLE_BOOKS_ID`
- `TITULO`
- `NOTA`
- `COMENTARIO`
- `DT_AVALIACAO`
- `COD_USUARIO`

Observacoes importantes:

- O backend faz upsert logico por `COD_USUARIO + GOOGLE_BOOKS_ID`.
- O script atual adiciona `GOOGLE_BOOKS_ID` e `TITULO` se a tabela antiga ja existir.
- Se a tabela antiga tiver `COD_LIVRO`, o script faz backfill de `TITULO` a partir de `FERNANDO.LIVROS`.
- O script nao remove `COD_LIVRO` nem migra automaticamente para um `googleBooksId` real.

Recomendacao:

- Criar depois um indice unico em `COD_USUARIO, GOOGLE_BOOKS_ID` para evitar duplicatas em concorrencia.

## Ordem recomendada de setup

Num ambiente novo, rode:

```bash
npm run db:chat
npm run db:preferences
npm run db:quiz
npm run db:password-reset
node scripts/createAvaliacoesTable.js
```

Se precisar de usuario de teste:

```bash
npm run seed:user -- --email=admin@example.com --password=123456
```

## Relacao entre backend e banco

- Auth:
  - le e escreve em `FERNANDO.USUARIOS_TESTE`

- Chat:
  - le e escreve em `CONVERSAS`
  - le e escreve em `PREFERENCIAS_USUARIO`
  - le e escreve em `SUGESTOES_CONVERSA`
  - le `AVALIACOES`

- Quiz:
  - le e escreve em `QUIZ_SESSOES`
  - opcionalmente escreve em `PREFERENCIAS_USUARIO`
  - le `AVALIACOES`

- Catalogo:
  - usa Google Books como fonte principal
  - nao depende do Oracle para busca geral do MVP

- Avaliacoes:
  - le e escreve em `AVALIACOES`
  - liga o registro ao usuario por `COD_USUARIO`

## Limites e debitos atuais

- Ainda existe heranca do catalogo local antigo no script de migracao de avaliacoes.
- Nao existe migracao automatica de avaliacoes antigas para `googleBooksId`.
- Nao existe ainda um indice unico para `COD_USUARIO + GOOGLE_BOOKS_ID`.
- O catalogo do MVP depende do Google Books para busca, capas e preview.
