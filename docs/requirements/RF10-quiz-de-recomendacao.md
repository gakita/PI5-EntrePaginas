# RF10 - Quiz para achar um livro

## Objetivo

Oferecer um quiz guiado para inferir preferencias e gerar recomendacoes.

## Status

Implementado no backend.

## Endpoints

- `POST /quiz/start`
- `POST /quiz/answer`
- `POST /quiz/finish`

## Regra de negocio

- quiz sempre inicia com perguntas objetivas fixas
- depois disso pode gerar perguntas adaptativas com IA
- limite maximo de 8 perguntas
- `finish` pode salvar preferencias inferidas

## Banco

- tabela local: `QUIZ_SESSOES`
- criar com `npm run db:quiz`

## Frontend

Fluxo minimo:

1. iniciar com `POST /quiz/start`
2. guardar `sessionId`
3. enviar cada resposta com `POST /quiz/answer`
4. finalizar com `POST /quiz/finish`
5. renderizar preferencias inferidas e recomendacoes

## Erros esperados

- `404` se sessao nao existir
- `409` se quiz ja estiver finalizado ou excedido
- `400` se usuario tentar finalizar cedo demais

## Checklist

- nunca chamar `/quiz/answer` sem `sessionId`
- mostrar estado `canFinish`
- finalizar automaticamente se `isComplete` vier `true`
