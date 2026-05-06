# RF12 - Salvar somente a ultima conversa

## Objetivo

Persistir apenas a conversa ativa/mais recente do usuario.

## Status

Implementado no backend.

## Endpoints envolvidos

- `POST /chat/message`
- `GET /chat/history`
- `DELETE /chat/history`

## Regra de negocio

- a tabela `CONVERSAS` guarda uma conversa por usuario
- o model faz upsert pela chave de usuario
- limpar historico apaga essa conversa ativa

## Banco

- tabela local: `CONVERSAS`
- criar com `npm run db:chat`

## Frontend

Fluxo recomendado:

1. ao abrir chat, chamar `GET /chat/history`
2. continuar a conversa existente se houver mensagens
3. usar `DELETE /chat/history` apenas quando o usuario realmente quiser reiniciar

## Checklist

- reidratar historico no carregamento da tela
- oferecer acao explicita de limpar conversa
- nao assumir historico infinito
