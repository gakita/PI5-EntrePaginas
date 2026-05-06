# RF01 - Cadastro de usuario

## Objetivo

Permitir que um novo usuario crie conta no sistema.

## Status

Implementado no backend.

## Endpoint

`POST /auth/register`

Body:

```json
{
  "name": "Joao",
  "email": "joao@example.com",
  "password": "123456"
}
```

## Regra de negocio

- `name`, `email` e `password` sao obrigatorios
- senha e armazenada com hash
- usuario e persistido em `FERNANDO.USUARIOS_TESTE`
- a resposta ja devolve autenticacao para iniciar a sessao

## Banco

- tabela externa: `FERNANDO.USUARIOS_TESTE`

## Frontend

Fluxo minimo:

1. exibir formulario com nome, email e senha
2. chamar `POST /auth/register`
3. guardar o token retornado
4. redirecionar para a area autenticada

## Erros esperados

- `400` se faltar campo obrigatorio
- `409` se o email ja existir

## Checklist

- validar campos antes do submit
- tratar mensagens de erro de cadastro
- guardar token em storage seguro da app
