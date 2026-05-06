# RF03 - Recuperacao de senha

## Objetivo

Permitir que o usuario solicite redefinicao de senha.

## Status

Implementado no backend.

## Endpoints

- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## Regra de negocio

- `forgot-password` sempre retorna mensagem generica
- se SMTP estiver configurado, o backend envia email
- tokens sao armazenados com hash em `PASSWORD_RESET_TOKENS`

## Banco

- tabela local: `PASSWORD_RESET_TOKENS`
- preparar com `npm run db:password-reset`

## Frontend

Fluxo minimo:

1. tela "esqueci minha senha" envia email para `POST /auth/forgot-password`
2. usuario recebe link ou token
3. tela de redefinicao chama `POST /auth/reset-password` com `token` e `newPassword`

## Erros esperados

- `400` se faltarem campos
- `400` se token estiver invalido, usado ou expirado

## Checklist

- nao revelar se email existe
- mostrar confirmacao neutra apos solicitar recuperacao
- validar senha nova antes do submit
