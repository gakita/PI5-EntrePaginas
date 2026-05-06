# RF04 - Preferencias salvas por usuario

## Objetivo

Persistir preferencias de leitura por usuario e reutiliza-las no chat e no quiz.

## Status

Implementado no backend.

## Endpoints

- `GET /chat/preferences`
- `PUT /chat/preferences`
- `DELETE /chat/preferences`

## Regra de negocio

- preferencias sao arrays de `genres`, `types` e `favoriteAuthors`
- podem ser inferidas pelo chat/quiz ou editadas manualmente
- sao persistidas em `PREFERENCIAS_USUARIO`

## Banco

- tabela local: `PREFERENCIAS_USUARIO`
- criada por `npm run db:preferences`

## Frontend

Fluxo minimo:

1. carregar preferencias no perfil com `GET /chat/preferences`
2. editar e salvar com `PUT /chat/preferences`
3. opcionalmente oferecer reset com `DELETE /chat/preferences`

## Erros esperados

- `401` se usuario nao estiver autenticado
- `400` se algum campo enviado nao for array

## Checklist

- tratar arrays vazios como estado valido
- refletir preferencias no quiz e no chat
- permitir reset manual
