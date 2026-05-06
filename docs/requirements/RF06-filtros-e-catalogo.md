# RF06 - Filtros gerais e catalogo

## Objetivo

Permitir filtrar resultados e recomendacoes por categoria, tema e tipo.

## Status

Implementado no backend usando Google Books como fonte principal do catalogo.

## Endpoint

`GET /books`

Query params suportados:

- `search`
- `author`
- `category`
- `theme`
- `type`
- `page`
- `limit`

## Regra de negocio

- o backend traduz os filtros para query do Google Books
- a resposta e paginada e normalizada
- `type` e inferido pelo backend:
  - `manga` para indicios de manga
  - `hq` para comics / graphic novel / quadrinhos
  - `livro` no restante

## Frontend

Fluxo recomendado:

1. montar estado de filtros
2. converter filtros em query string
3. chamar `GET /books`
4. renderizar `items`
5. usar `page`, `limit` e `totalItems` para paginacao

## Erros esperados

- `502` se a busca no Google Books falhar
- `504` se a busca expirar por timeout

## Checklist

- debounce no campo de busca
- resetar paginacao ao trocar filtros
- tratar lista vazia
