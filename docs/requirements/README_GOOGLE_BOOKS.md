# Funcionalidade Google Books

Esta funcionalidade enriquece livros recomendados pela IA com dados oficiais da Google Books API.

## O que o backend faz

O Gemini continua responsável por recomendar obras e gerar a justificativa. Depois disso, o backend consulta o Google Books para buscar metadados de catálogo:

- título oficial
- autores
- categorias
- gêneros
- sinopse
- capa
- data de publicação
- ID do volume no Google Books
- links de preview/leitor
- disponibilidade para Embedded Viewer

## Busca usada

O backend monta uma busca mais precisa com operadores da Google Books API:

```text
q=intitle:"Dom Casmurro" inauthor:"Machado de Assis"
```

Isso é melhor do que buscar apenas `Dom Casmurro Machado de Assis`, porque reduz resultados errados e aumenta a chance de vir capa/sinopse.

## Endpoint de teste

```http
GET /books/search?title=Dom%20Casmurro&author=Machado%20de%20Assis
```

Resposta esperada:

```json
{
  "title": "Dom Casmurro",
  "author": "Machado de Assis",
  "authors": ["Machado de Assis"],
  "categories": ["Fiction"],
  "genres": ["Fiction"],
  "coverUrl": "https://books.google.com/books/content?id=...",
  "synopsis": "Texto da sinopse...",
  "publishedDate": "2024-10-03",
  "googleBooksId": "qmE0EQAAQBAJ",
  "previewLink": "https://books.google.com.br/books?id=...",
  "webReaderLink": "https://play.google.com/books/reader?id=...",
  "embeddable": true,
  "viewability": "PARTIAL"
}
```

## Campos retornados

| Campo | Tipo | Origem | Observação |
|---|---:|---|---|
| `title` | string | Google Books | Se não achar volume, mantém o título original |
| `author` | string | Google Books ou IA | Autores unidos por vírgula |
| `authors` | array | Google Books | Lista oficial de autores |
| `categories` | array | Google Books | Categorias brutas de `volumeInfo.categories` |
| `genres` | array | Backend | Primeiro nível de cada categoria |
| `coverUrl` | string/null | Google Books | Vem de `volumeInfo.imageLinks.thumbnail` em HTTPS |
| `synopsis` | string/null | Google Books | Vem de `volumeInfo.description`, truncada em 500 caracteres |
| `publishedDate` | string/null | Google Books | Data/ano de publicação |
| `googleBooksId` | string/null | Google Books | ID do volume |
| `previewLink` | string/null | Google Books | Link externo para preview |
| `webReaderLink` | string/null | Google Books | Link externo para leitor |
| `embeddable` | boolean | Google Books | Indica se pode tentar viewer embutido |
| `viewability` | string/null | Google Books | Ex.: `PARTIAL`, `ALL_PAGES`, `NO_PAGES` |

Não existe campo `subgenres` no contrato da API do projeto. A Google Books API também não entrega subgênero separado de forma confiável.

## Configuração

No `.env`:

```env
GOOGLE_BOOKS_API_KEY=sua_chave
```

A chave é opcional para buscas básicas. Se a chamada com chave falhar por autorização, limite ou erro temporário, o backend tenta uma busca pública sem `key`.

## Página de teste

Com a API rodando:

```bash
npm run dev
```

Abra:

```text
http://localhost:3000/google-books-test.html
```

Essa página usa o endpoint `/books/search`, mostra capa e metadados, e só carrega o Embedded Viewer quando o botão `Carregar viewer` é clicado.
