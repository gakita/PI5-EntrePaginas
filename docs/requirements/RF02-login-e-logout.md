# RF02 - Login e logout

## Objetivo

Permitir autenticacao do usuario e encerramento da sessao no frontend.

## Status

Login implementado no backend. Logout e responsabilidade do frontend, removendo o token local.

## Endpoints

- `POST /auth/login`
- `GET /auth/me`
- `PATCH /auth/me`
- `DELETE /auth/me`

## Regra de negocio

- `email` e `password` sao obrigatorios no login
- autenticacao usa JWT
- rotas protegidas exigem `Authorization: Bearer <token>`

## Banco

- tabela externa: `FERNANDO.USUARIOS_TESTE`

## Frontend

Fluxo minimo:

1. exibir tela de login
2. chamar `POST /auth/login`
3. guardar token
4. opcionalmente chamar `GET /auth/me` para hidratar perfil
5. no logout, apagar token e limpar estado local

## Erros esperados

- `400` por payload invalido
- `401` por credenciais invalidas

## Checklist

- interceptar `401` globalmente
- redirecionar para login quando token expirar
- limpar caches locais no logout
