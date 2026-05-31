/**
 * catalogService.js — Enriquecimento de recomendações via Google Books API.
 *
 * Após o Gemini gerar as recomendações, este serviço busca na
 * Google Books API informações adicionais sobre cada obra:
 *   - Título, autores e gêneros oficiais do catálogo
 *   - URL da capa (thumbnail)
 *   - Sinopse (description)
 *   - Data de publicação
 *   - Links e metadados para preview / Google Books Embedded Viewer
 *
 * A Google Books API é gratuita para buscas básicas (sem API key),
 * com limite de ~1000 requisições/dia. Com API key, o limite aumenta.
 *
 * Documentação: https://developers.google.com/books/docs/v1/reference/volumes/list
 */

const env = require('../config/env');
const logger = require('../utils/logger');

// Tempo máximo para esperar resposta da API (ms)
const TIMEOUT_MS = 5000;
const DEFAULT_CATALOG_LIMIT = 10;
const MAX_CATALOG_LIMIT = 20;

const HOME_CATEGORIES = [
  {
    slug: 'fantasia',
    label: 'Fantasia',
    imageUrl: '/images/categories/generic-book.svg',
    fallbackImageUrl: '/images/categories/generic-book.svg',
    googleBooksQuery: 'subject:fantasy',
  },
  {
    slug: 'ficcao-cientifica',
    label: 'Ficcao Cientifica',
    imageUrl: '/images/categories/generic-book.svg',
    fallbackImageUrl: '/images/categories/generic-book.svg',
    googleBooksQuery: 'subject:science fiction',
  },
  {
    slug: 'romance',
    label: 'Romance',
    imageUrl: '/images/categories/generic-book.svg',
    fallbackImageUrl: '/images/categories/generic-book.svg',
    googleBooksQuery: 'subject:romance',
  },
  {
    slug: 'terror',
    label: 'Terror',
    imageUrl: '/images/categories/generic-book.svg',
    fallbackImageUrl: '/images/categories/generic-book.svg',
    googleBooksQuery: 'subject:horror',
  },
  {
    slug: 'misterio',
    label: 'Misterio',
    imageUrl: '/images/categories/generic-book.svg',
    fallbackImageUrl: '/images/categories/generic-book.svg',
    googleBooksQuery: 'subject:mystery',
  },
  {
    slug: 'hq',
    label: 'HQ',
    imageUrl: '/images/categories/generic-book.svg',
    fallbackImageUrl: '/images/categories/generic-book.svg',
    googleBooksQuery: 'subject:comics',
  },
  {
    slug: 'manga',
    label: 'Manga',
    imageUrl: '/images/categories/generic-book.svg',
    fallbackImageUrl: '/images/categories/generic-book.svg',
    googleBooksQuery: 'subject:manga',
  },
];

/**
 * Busca dados de enriquecimento para uma obra na Google Books API.
 *
 * @param {object} rec - Recomendação do Gemini {title, author, type, ...}
 * @returns {object} Recomendação enriquecida com metadados do Google Books.
 */
async function enrichOne(rec) {
  try {
    // Monta a query com operadores do Google Books para aumentar precisão.
    const query = buildBookQuery(rec);
    const encodedQuery = encodeURIComponent(query);

    // Usa AbortController para timeout — evita que uma API lenta trave o chat
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response = await fetch(buildSearchUrl(encodedQuery, true), { signal: controller.signal });

    if (shouldRetryWithoutKey(response) && env.googleBooksApiKey) {
      logger.warn('Google Books API com key falhou; tentando busca publica', {
        status: response.status,
        title: rec.title,
      });
      response = await fetch(buildSearchUrl(encodedQuery, false), { signal: controller.signal });
    }

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn('Google Books API retornou erro', { status: response.status, title: rec.title });
      // Retorna campos nulos para manter schema consistente (não lança erro)
      return withEmptyCatalogFields(rec);
    }

    const data = await response.json();

    // Se não encontrou resultados, retorna com campos nulos (garante schema consistente)
    if (!data.items || data.items.length === 0) {
      return withEmptyCatalogFields(rec);
    }

    const volume = data.items[0];
    const info = volume.volumeInfo || {};
    const access = volume.accessInfo || {};
    const authors = Array.isArray(info.authors) ? info.authors : [];
    const categoryInfo = normalizeCategories(info.categories);

    // Adiciona os campos de enriquecimento à recomendação original
    return {
      ...rec,
      googleBooksId: volume.id || null,
      title:         info.title || rec.title || null,
      authors,
      categories:    categoryInfo.categories,
      genres:        categoryInfo.genres,
      author:        authors.length > 0 ? authors.join(', ') : rec.author || null,
      // Thumbnail em HTTPS (a API retorna HTTP por padrão)
      coverUrl:      toHttps(info.imageLinks?.thumbnail),
      // Trunca a sinopse em 500 caracteres para não sobrecarregar a resposta
      synopsis:      info.description ? info.description.substring(0, 500) : null,
      publishedDate: info.publishedDate || null,
      previewLink:   toHttps(info.previewLink),
      webReaderLink: toHttps(access.webReaderLink),
      embeddable:    Boolean(access.embeddable),
      viewability:   access.viewability || null,
    };
  } catch (err) {
    // Em caso de erro (timeout, rede, etc.), retorna com os campos vazios
    if (err.name === 'AbortError') {
      logger.warn('Google Books API timeout', { title: rec.title });
    } else {
      logger.warn('Erro ao enriquecer recomendação', { title: rec.title, error: err.message });
    }
    return withEmptyCatalogFields(rec);
  }
}

function getHomeCategories() {
  return HOME_CATEGORIES.map((category) => ({ ...category }));
}

function normalizeCatalogFilters(filters = {}) {
  const page = Number.isFinite(Number(filters.page)) && Number(filters.page) > 0
    ? Number(filters.page)
    : 1;
  const rawLimit = Number.isFinite(Number(filters.limit)) && Number(filters.limit) > 0
    ? Number(filters.limit)
    : DEFAULT_CATALOG_LIMIT;
  const limit = Math.min(rawLimit, MAX_CATALOG_LIMIT);

  return {
    search: normalizeText(filters.search),
    author: normalizeText(filters.author),
    category: normalizeText(filters.category),
    theme: normalizeText(filters.theme),
    type: normalizeType(filters.type),
    page,
    limit,
  };
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeType(value) {
  const normalized = normalizeText(value).toLowerCase();

  if (normalized === 'hq') return 'hq';
  if (normalized === 'manga' || normalized === 'mangá') return 'manga';
  if (normalized === 'livro') return 'livro';
  return '';
}

function buildCatalogQuery(filters) {
  const parts = [];

  if (filters.search) {
    parts.push(filters.search);
  }

  if (filters.author) {
    parts.push(`inauthor:"${filters.author}"`);
  }

  if (filters.category) {
    parts.push(`subject:${filters.category}`);
  }

  if (filters.theme) {
    parts.push(`subject:${filters.theme}`);
  }

  if (filters.type === 'hq') {
    parts.push('subject:comics');
  } else if (filters.type === 'manga') {
    parts.push('subject:manga');
  }

  return parts.join(' ').trim() || 'books';
}

const FALLBACK_BOOKS = [
  {
    googleBooksId: "fallback_id_horror_1",
    title: "O Iluminado",
    author: "Stephen King",
    authors: ["Stephen King"],
    type: "livro",
    categories: ["Terror", "Horror", "Suspense"],
    genres: ["Terror", "Horror", "Suspense"],
    coverUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400&auto=format&fit=crop",
    synopsis: "O Iluminado é um romance de terror de Stephen King. Conta a história Jack Torrance, um escritor que aceita o emprego de zelador de inverno no isolado Hotel Overlook.",
    publishedDate: "1977-01-28",
    previewLink: "https://books.google.com/books?id=p3NDDwAAQBAJ",
    webReaderLink: "https://books.google.com/books?id=p3NDDwAAQBAJ",
    embeddable: true,
    viewability: "PARTIAL"
  },
  {
    googleBooksId: "fallback_id_horror_2",
    title: "Drácula",
    author: "Bram Stoker",
    authors: ["Bram Stoker"],
    type: "livro",
    categories: ["Terror", "Horror", "Gótico"],
    genres: ["Terror", "Horror", "Gótico"],
    coverUrl: "https://images.unsplash.com/photo-1510137600163-2729bc6959a6?q=80&w=400&auto=format&fit=crop",
    synopsis: "Drácula é um romance de ficção gótica de terror de 1897 do autor irlandês Bram Stoker, célebre por introduzir o personagem do Conde Drácula.",
    publishedDate: "1897-05-26",
    previewLink: "https://books.google.com/books?id=9OasDwAAQBAJ",
    webReaderLink: "https://books.google.com/books?id=9OasDwAAQBAJ",
    embeddable: true,
    viewability: "PARTIAL"
  },
  {
    googleBooksId: "fallback_id_fantasy_1",
    title: "O Hobbit",
    author: "J.R.R. Tolkien",
    authors: ["J.R.R. Tolkien"],
    type: "livro",
    categories: ["Fantasia", "Aventura"],
    genres: ["Fantasia", "Aventura"],
    coverUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=400&auto=format&fit=crop",
    synopsis: "Bilbo Bolseiro era um hobbit de vida confortável e pacífica, que nunca saía em aventuras... até que o mago Gandalf e uma companhia de anões batem à sua porta.",
    publishedDate: "1937-09-21",
    previewLink: "https://books.google.com/books?id=5JQ4DwAAQBAJ",
    webReaderLink: "https://books.google.com/books?id=5JQ4DwAAQBAJ",
    embeddable: true,
    viewability: "PARTIAL"
  },
  {
    googleBooksId: "fallback_id_scifi_1",
    title: "Duna",
    author: "Frank Herbert",
    authors: ["Frank Herbert"],
    type: "livro",
    categories: ["Ficção Científica", "Sci-Fi"],
    genres: ["Ficção Científica", "Sci-Fi"],
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop",
    synopsis: "Duna é um romance de ficção científica do escritor americano Frank Herbert, ambientado em um futuro distante onde casas nobres controlam feudos planetários.",
    publishedDate: "1965-06-01",
    previewLink: "https://books.google.com/books?id=3e84DwAAQBAJ",
    webReaderLink: "https://books.google.com/books?id=3e84DwAAQBAJ",
    embeddable: true,
    viewability: "PARTIAL"
  },
  {
    googleBooksId: "fallback_id_romance_1",
    title: "Orgulho e Preconceito",
    author: "Jane Austen",
    authors: ["Jane Austen"],
    type: "livro",
    categories: ["Romance", "Clássicos"],
    genres: ["Romance", "Clássicos"],
    coverUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400&auto=format&fit=crop",
    synopsis: "Orgulho e Preconceito é o romance mais famoso de Jane Austen. Retrata as relações turbulentas entre Elizabeth Bennet e Fitzwilliam Darcy.",
    publishedDate: "1813-01-28",
    previewLink: "https://books.google.com/books?id=qW84DwAAQBAJ",
    webReaderLink: "https://books.google.com/books?id=qW84DwAAQBAJ",
    embeddable: true,
    viewability: "PARTIAL"
  },
  {
    googleBooksId: "fallback_id_hq_1",
    title: "Watchmen",
    author: "Alan Moore",
    authors: ["Alan Moore"],
    type: "hq",
    categories: ["Comics", "HQ", "Super-heróis"],
    genres: ["Comics", "HQ", "Super-heróis"],
    coverUrl: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=400&auto=format&fit=crop",
    synopsis: "Considerada a obra-prima das histórias em quadrinhos, Watchmen desconstrói o gênero dos super-heróis em uma trama densa de conspiração política.",
    publishedDate: "1986-09-01",
    previewLink: "https://books.google.com/books?id=1eU4DwAAQBAJ",
    webReaderLink: "https://books.google.com/books?id=1eU4DwAAQBAJ",
    embeddable: true,
    viewability: "PARTIAL"
  },
  {
    googleBooksId: "fallback_id_manga_1",
    title: "Death Note - Volume 1",
    author: "Tsugumi Ohba",
    authors: ["Tsugumi Ohba", "Takeshi Obata"],
    type: "manga",
    categories: ["Manga", "Mangá", "Suspense", "Sobrenatural"],
    genres: ["Manga", "Mangá", "Suspense", "Sobrenatural"],
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop",
    synopsis: "Light Yagami encontra um caderno misterioso que permite matar qualquer pessoa escrevendo seu nome. Começa assim a sua jornada como Kira.",
    publishedDate: "2003-12-01",
    previewLink: "https://books.google.com/books?id=1us4DwAAQBAJ",
    webReaderLink: "https://books.google.com/books?id=1us4DwAAQBAJ",
    embeddable: true,
    viewability: "PARTIAL"
  }
];

function getFallbackCatalog(filters) {
  let filtered = [...FALLBACK_BOOKS];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(b => 
      b.title.toLowerCase().includes(searchLower) || 
      b.author.toLowerCase().includes(searchLower)
    );
  }

  if (filters.type) {
    filtered = filtered.filter(b => b.type === filters.type);
  }

  if (filters.category || filters.theme) {
    const catLower = (filters.category || filters.theme).toLowerCase();
    filtered = filtered.filter(b => 
      b.categories.some(c => c.toLowerCase().includes(catLower)) ||
      b.genres.some(g => g.toLowerCase().includes(catLower))
    );
  }

  const startIndex = (filters.page - 1) * filters.limit;
  const items = filtered.slice(startIndex, startIndex + filters.limit);

  return {
    items,
    page: filters.page,
    limit: filters.limit,
    totalItems: filtered.length
  };
}

async function searchCatalog(filters = {}) {
  const normalizedFilters = normalizeCatalogFilters(filters);
  const startIndex = (normalizedFilters.page - 1) * normalizedFilters.limit;
  const encodedQuery = encodeURIComponent(buildCatalogQuery(normalizedFilters));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let response = await fetch(
      buildListUrl(encodedQuery, normalizedFilters.limit, startIndex, true),
      { signal: controller.signal }
    );

    if (shouldRetryWithoutKey(response) && env.googleBooksApiKey) {
      logger.warn('Google Books catalog search with key failed; retrying public search', {
        status: response.status,
        query: buildCatalogQuery(normalizedFilters),
      });
      response = await fetch(
        buildListUrl(encodedQuery, normalizedFilters.limit, startIndex, false),
        { signal: controller.signal }
      );
    }

    if (!response.ok) {
      logger.warn('Google Books falhou ou deu limit rate. Ativando catálogo de fallback local!');
      return getFallbackCatalog(normalizedFilters);
    }

    const data = await response.json();

    return {
      items: (data.items || []).map((item) => normalizeCatalogItem(item)),
      page: normalizedFilters.page,
      limit: normalizedFilters.limit,
      totalItems: Number.isFinite(data.totalItems) ? data.totalItems : 0,
    };
  } catch (error) {
    logger.warn('Erro na busca do catálogo, ativando fallback local', { error: error.message });
    return getFallbackCatalog(normalizedFilters);
  } finally {
    clearTimeout(timeout);
  }
}

function buildBookQuery(rec) {
  const parts = [];

  if (rec.title) {
    parts.push(`intitle:"${rec.title}"`);
  }

  if (rec.author) {
    parts.push(`inauthor:"${rec.author}"`);
  }

  return parts.join(' ') || [rec.title, rec.author].filter(Boolean).join(' ');
}

function normalizeCategories(categories) {
  const rawCategories = Array.isArray(categories) ? categories.filter(Boolean) : [];
  const genres = new Set();

  for (const category of rawCategories) {
    const parts = String(category)
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts[0]) {
      genres.add(parts[0]);
    }
  }

  return {
    categories: rawCategories,
    genres: Array.from(genres),
  };
}

function buildSearchUrl(encodedQuery, includeKey) {
  const keyParam = includeKey && env.googleBooksApiKey ? `&key=${env.googleBooksApiKey}` : '';
  return `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=1&langRestrict=pt&printType=books${keyParam}`;
}

function buildListUrl(encodedQuery, limit, startIndex, includeKey) {
  const keyParam = includeKey && env.googleBooksApiKey ? `&key=${env.googleBooksApiKey}` : '';
  return `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&startIndex=${startIndex}&maxResults=${limit}&langRestrict=pt&printType=books${keyParam}`;
}

function shouldRetryWithoutKey(response) {
  return response.status === 403 || response.status === 429 || response.status >= 500;
}

function toHttps(url) {
  return typeof url === 'string' ? url.replace(/^http:\/\//, 'https://') : null;
}

function withEmptyCatalogFields(rec) {
  return {
    ...rec,
    googleBooksId: null,
    categories:    [],
    authors:       [],
    genres:        [],
    coverUrl:      null,
    synopsis:      null,
    publishedDate: null,
    previewLink:   null,
    webReaderLink: null,
    embeddable:    false,
    viewability:   null,
  };
}

function inferCatalogType({ categories, title }) {
  const text = [...(Array.isArray(categories) ? categories : []), title]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (text.includes('manga') || text.includes('mangá')) {
    return 'manga';
  }

  if (
    text.includes('comic') ||
    text.includes('comics') ||
    text.includes('graphic novel') ||
    text.includes('quadrinho') ||
    text.includes('hq')
  ) {
    return 'hq';
  }

  return 'livro';
}

function normalizeCatalogItem(item) {
  const volume = item || {};
  const info = volume.volumeInfo || {};
  const access = volume.accessInfo || {};
  const authors = Array.isArray(info.authors) ? info.authors : [];
  const categoryInfo = normalizeCategories(info.categories);

  return {
    googleBooksId: volume.id || null,
    title: info.title || null,
    author: authors.length > 0 ? authors.join(', ') : null,
    authors,
    type: inferCatalogType({ categories: info.categories, title: info.title }),
    categories: categoryInfo.categories,
    genres: categoryInfo.genres,
    coverUrl: toHttps(info.imageLinks?.thumbnail),
    synopsis: info.description ? info.description.substring(0, 500) : null,
    publishedDate: info.publishedDate || null,
    previewLink: toHttps(info.previewLink),
    webReaderLink: toHttps(access.webReaderLink),
    embeddable: Boolean(access.embeddable),
    viewability: access.viewability || null,
  };
}

/**
 * Enriquece todas as recomendações em paralelo.
 * Usa Promise.allSettled para garantir que uma falha não cancele as outras.
 *
 * @param {Array} recommendations
 * @returns {Array} Recomendações enriquecidas (com fallback nas que falharem).
 */
async function enrichRecommendations(recommendations) {
  if (!recommendations || recommendations.length === 0) return [];

  const start = Date.now();

  // Promise.allSettled garante que todos os itens são processados,
  // mesmo que algumas buscas falhem individualmente.
  const results = await Promise.allSettled(
    recommendations.map((rec) => enrichOne(rec))
  );

  const enriched = results.map((result, i) =>
    result.status === 'fulfilled' ? result.value : recommendations[i]
  );

  logger.info('Enriquecimento concluído', {
    total: recommendations.length,
    durationMs: Date.now() - start,
  });

  return enriched;
}

async function findBookMetadata({ title, author }) {
  return enrichOne({
    title,
    author,
    type: null,
    justification: null,
    sensitiveContent: false,
  });
}

async function getBookById(id) {
  // 1. Verificar se o ID corresponde a algum do nosso catálogo de fallback local
  const localFallback = FALLBACK_BOOKS.find(b => b.googleBooksId === id);
  if (localFallback) {
    return localFallback;
  }

  // 2. Tentar buscar da API externa do Google Books
  try {
    const includeKey = true;
    const keyParam = includeKey && env.googleBooksApiKey ? `&key=${env.googleBooksApiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?langRestrict=pt${keyParam}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      if (shouldRetryWithoutKey(response) && includeKey) {
        // Tentar sem a chave API
        const retryUrl = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?langRestrict=pt`;
        const retryResponse = await fetch(retryUrl);
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          return normalizeCatalogItem(data);
        }
      }
      throw new Error(`Google Books API returned status ${response.status}`);
    }

    const data = await response.json();
    return normalizeCatalogItem(data);
  } catch (error) {
    console.log(`[catalogService] Erro ao buscar livro ${id} na API externa, usando fallback local:`, error.message);
    
    // Se der qualquer erro na API externa do Google Books, retorna o primeiro livro do fallback
    // para que a tela não fique em branco e mostre um livro real!
    return FALLBACK_BOOKS[0]; 
  }
}

module.exports = {
  getHomeCategories,
  searchCatalog,
  enrichRecommendations,
  findBookMetadata,
  getBookById,
};
