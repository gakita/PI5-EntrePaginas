# RF09 - Chat de recomendacao

## Objetivo

Permitir conversa com IA para pedir recomendacoes de livros, HQs e mangas.

## Status

Implementado no backend.

## Endpoints

- `POST /chat/message`
- `GET /chat/history`
- `DELETE /chat/history`

## Regra de negocio

- todas as rotas exigem JWT
- o backend combina ultima conversa, preferencias e livros ja avaliados
- a IA retorna resposta textual e recomendacoes estruturadas
- o backend enriquece itens com Google Books

## Frontend

Fluxo minimo:

1. abrir interface de chat
2. enviar texto para `POST /chat/message`
3. renderizar `reply` e `recommendations`
4. ao reabrir a tela, recuperar `GET /chat/history`

## Erros esperados

- `401` se faltar token
- `500` ou `502` em falha da cadeia de IA / integracoes

## Checklist

- renderizar recomendacoes como cards
- lidar com capas nulas
- exibir estado de loading na mensagem
