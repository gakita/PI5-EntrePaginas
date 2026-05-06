# RF07 - Banner de categoria adiciona filtro

## Objetivo

Ao clicar em um banner/categoria, o sistema deve abrir a exploracao com filtro aplicado.

## Status

Suporte de backend implementado. O comportamento de clique e navegacao e do frontend.

## Endpoints envolvidos

- `GET /books/categories`
- `GET /books`

## Regra de negocio

- `googleBooksQuery` da categoria indica o assunto base
- `slug` identifica a categoria no frontend
- o backend nao precisa de endpoint especial para o clique

## Frontend

Fluxo recomendado:

1. usuario clica no card da categoria
2. frontend navega para a tela de catalogo
3. frontend aplica `category` a partir da categoria clicada
4. frontend chama `GET /books?category=...`

## Checklist

- preservar o filtro aplicado na URL
- exibir tag/estado visual da categoria ativa
- permitir limpar o filtro depois
