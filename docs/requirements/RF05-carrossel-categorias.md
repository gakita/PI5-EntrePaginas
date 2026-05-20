# RF05 - Carrossel de banners/categorias

## Objetivo

Exibir um carrossel de categorias na home sem depender de IA.

## Status

Implementado no backend com categorias curadas.

## Endpoint

`GET /books/categories`

Resposta:

```json
[
  {
    "slug": "fantasia",
    "label": "Fantasia",
    "imageUrl": "/images/categories/generic-book.svg",
    "fallbackImageUrl": "/images/categories/generic-book.svg",
    "googleBooksQuery": "subject:fantasy"
  }
]
```

## Regra de negocio

- a lista de categorias e estatica no backend
- o backend nao consulta IA para montar o carrossel
- `googleBooksQuery` serve para o frontend buscar uma capa real no Google Books
- `fallbackImageUrl` cobre categorias sem capa encontrada

## Frontend

Fluxo recomendado:

1. chamar `GET /books/categories`
2. para cada categoria, chamar `GET /books?category=...&limit=1`
3. usar `coverUrl` do primeiro item como imagem do card
4. se `coverUrl` vier `null`, usar `fallbackImageUrl`

## Erros esperados

- `200` com lista vazia nao e esperado hoje
- em falha de rede, o frontend pode cair para um layout com placeholders

## Checklist

- cachear categorias na home
- fazer lazy loading das capas do carrossel
- usar `slug` como chave de navegacao
