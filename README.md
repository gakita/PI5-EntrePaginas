# Backend Node.js + Express com Oracle

Backend em JavaScript com Node.js + Express, autenticacao via JWT e persistencia real em Oracle Database.

## Requisitos

- Node.js instalado
- Wallet do Oracle Autonomous Database disponivel localmente
- Arquivo `.env` configurado a partir de `.env.example`

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` com base no `.env.example`.

3. Inicie a API:

```bash
npm run dev
```

Ou:

```bash
npm start
```

## Inserir usuario de teste

Use o script abaixo para criar ou atualizar um usuario na tabela `FERNANDO.USUARIOS_TESTE` com senha em bcrypt:

```bash
npm run seed:user -- --email=admin@example.com --password=123456
```

O script faz `MERGE`, entao atualiza a senha se o email ja existir.

## Testar autenticacao

1. Cadastre um usuario:

```http
POST /auth/register
Content-Type: application/json

{
  "name": "BacanaLindo",
  "email": "bacana2@example.com",
  "password": "123422"
}
```

2. Faça login:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "123456"
}
```

3. Copie o `token` retornado.

4. Teste a rota protegida:

```http
GET /auth/me
Authorization: Bearer SEU_TOKEN
```

## Variaveis de ambiente principais

- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_CONNECT_STRING`
- `ORACLE_CONFIG_DIR`
- `ORACLE_WALLET_LOCATION`
- `ORACLE_WALLET_PASSWORD`
- `JWT_SECRET`
