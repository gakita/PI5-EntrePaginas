# Implementação no Frontend: Google Books

Este guia mostra como consumir os campos de livro enriquecidos pelo backend.

## Onde os dados aparecem

Os mesmos campos aparecem em dois lugares:

- `POST /chat/message`: dentro de cada item de `recommendations`
- `GET /books/search?title=...&author=...`: endpoint simples para testar uma obra manualmente
- `GET /books?search=...&author=...&category=...&theme=...&type=...&page=...&limit=...`: catalogo geral com filtros
- `GET /books/categories`: categorias curadas para o carrossel da home

O frontend não precisa chamar a Google Books API diretamente. Use o backend.

## Exemplo de busca manual

```js
async function buscarLivro(title, author) {
  const params = new URLSearchParams({ title });
  if (author) params.set('author', author);

  const response = await fetch(`/books/search?${params.toString()}`);
  const book = await response.json();

  if (!response.ok) {
    throw new Error(book.message || 'Erro ao buscar livro.');
  }

  return book;
}
```

## Exemplo de catalogo com filtros

```js
async function buscarCatalogo(filters = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  const response = await fetch(`/books?${params.toString()}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao buscar catalogo.');
  }

  return payload;
}
```

Exemplo de uso:

```js
const data = await buscarCatalogo({
  category: 'fantasy',
  theme: 'magic',
  type: 'livro',
  page: 1,
  limit: 10,
});
```

## Exemplo de categorias da home

```js
async function buscarCategorias() {
  const response = await fetch('/books/categories');
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao buscar categorias.');
  }

  return payload;
}
```

## Exemplo de card de recomendação

```html
<article class="book-card">
  <img class="book-cover" src="CAPA_OU_PLACEHOLDER" alt="Capa do livro">
  <div>
    <h3>Título do livro</h3>
    <p>Autores</p>
    <p>Gêneros</p>
    <p>Sinopse</p>
    <a href="PREVIEW_LINK" target="_blank" rel="noreferrer">Visualizar</a>
  </div>
</article>
```

Mapeamento recomendado:

```js
function mapBookToCard(book) {
  return {
    title: book.title || 'Título não encontrado',
    authors: Array.isArray(book.authors) && book.authors.length > 0
      ? book.authors.join(', ')
      : book.author || 'Autor não informado',
    genres: Array.isArray(book.genres) && book.genres.length > 0
      ? book.genres.join(', ')
      : 'Gênero não informado',
    categories: Array.isArray(book.categories) ? book.categories : [],
    synopsis: book.synopsis || 'Sinopse não disponível.',
    coverUrl: book.coverUrl || '/placeholder-book.jpg',
    previewLink: book.previewLink || book.webReaderLink || null,
    canEmbed: Boolean(book.embeddable && book.googleBooksId),
  };
}
```

## Campos que o frontend deve tratar

| Campo | Como usar |
|---|---|
| `coverUrl` | Imagem principal do card. Usar placeholder se vier `null` |
| `title` | Título exibido no card |
| `authors` | Preferir esta lista para autores |
| `author` | Fallback textual para autores |
| `genres` | Lista resumida para exibir como gênero |
| `categories` | Lista bruta do Google Books, opcional para tela de detalhes |
| `synopsis` | Texto do resumo |
| `publishedDate` | Data/ano de publicação |
| `previewLink` | Botão externo “Visualizar” |
| `webReaderLink` | Fallback para botão externo |
| `embeddable` | Mostra se vale tentar viewer embutido |
| `googleBooksId` | ID usado pelo Google Books Viewer |
| `viewability` | Indica se há páginas disponíveis |

Não use `subgenres`. Esse campo foi removido do contrato.

## Placeholder de capa

Sempre trate capa ausente:

```js
const coverUrl = book.coverUrl || '/placeholder-book.jpg';
```

Também é útil tratar erro de carregamento da imagem:

```html
<img
  src="CAPA_OU_PLACEHOLDER"
  alt="Capa do livro"
  onerror="this.src='/placeholder-book.jpg'"
>
```

## Embedded Viewer

O viewer embutido deve ser opcional. Mesmo quando `embeddable` vem `true`, o Google pode não carregar o preview em alguns volumes ou ambientes.

Fluxo recomendado:

1. Mostre sempre o card com capa e metadados primeiro.
2. Mostre o botão `Visualizar` usando `previewLink`.
3. Mostre o botão `Carregar viewer` apenas se `embeddable === true` e `googleBooksId` existir.
4. Se o viewer falhar, mantenha o card visível e oriente o usuário a abrir o preview externo.

Exemplo:

```js
function canLoadEmbeddedViewer(book) {
  return Boolean(book.embeddable && book.googleBooksId);
}
```

## Exemplo Vue simples

```vue
<template>
  <article class="book-card">
    <img
      :src="card.coverUrl"
      :alt="`Capa de ${card.title}`"
      @error="event => event.target.src = '/placeholder-book.jpg'"
    >

    <div>
      <h3>{{ card.title }}</h3>
      <p>{{ card.authors }}</p>
      <p>{{ card.genres }}</p>
      <p>{{ card.synopsis }}</p>

      <a v-if="card.previewLink" :href="card.previewLink" target="_blank" rel="noreferrer">
        Visualizar
      </a>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
});

const card = computed(() => mapBookToCard(props.book));

function mapBookToCard(book) {
  return {
    title: book.title || 'Título não encontrado',
    authors: Array.isArray(book.authors) && book.authors.length > 0
      ? book.authors.join(', ')
      : book.author || 'Autor não informado',
    genres: Array.isArray(book.genres) && book.genres.length > 0
      ? book.genres.join(', ')
      : 'Gênero não informado',
    synopsis: book.synopsis || 'Sinopse não disponível.',
    coverUrl: book.coverUrl || '/placeholder-book.jpg',
    previewLink: book.previewLink || book.webReaderLink || null,
  };
}
</script>
```
