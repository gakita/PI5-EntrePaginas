// src/services/index.ts
// Serviço centralizado de comunicação com a API do backend.
// Todas as requisições passam pelo proxy Vite (/api → http://localhost:3001).

import { useAuthStore } from '@/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000)

// ─── Helper interno ───────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const auth = useAuthStore()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message || `Erro ${response.status}`)
  }

  // 204 No Content — sem corpo
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string
}

export interface AuthUser {
  name: string
  email: string
}

export interface RegisterResponse {
  message: string
  token: string
  user: AuthUser
}

export const authService = {
  /**
   * POST /auth/register
   * Cria uma conta e retorna { token, user }.
   */
  register(name: string, email: string, password: string): Promise<RegisterResponse> {
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  },

  /**
   * POST /auth/login
   * Retorna { token } que deve ser armazenado no authStore.
   */
  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  /**
   * GET /auth/me
   * Retorna os dados do usuário autenticado.
   */
  me(): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>('/auth/me')
  },

  /**
   * PATCH /auth/me
   * Atualiza dados do usuário (nome ou senha).
   */
  updateMe(data: { name?: string; currentPassword?: string; newPassword?: string }): Promise<{ message: string; user: AuthUser }> {
    return request<{ message: string; user: AuthUser }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * DELETE /auth/me
   * Deleta a conta do usuário.
   */
  deleteMe(data: { currentPassword?: string }): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/me', {
      method: 'DELETE',
      body: JSON.stringify(data),
    })
  },
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface BookRecommendation {
  title: string
  author?: string
  synopsis?: string
  coverUrl?: string
  publishedDate?: string
  genre?: string
}

export interface CatalogBook {
  googleBooksId: string | null
  title: string | null
  author: string | null
  authors: string[]
  type: string | null
  categories: string[]
  genres: string[]
  coverUrl: string | null
  synopsis: string | null
  publishedDate: string | null
  previewLink: string | null
  webReaderLink: string | null
  embeddable: boolean
  viewability: string | null
}

export interface CatalogResponse {
  items: CatalogBook[]
  page: number
  limit: number
  totalItems: number
}

interface FavoriteBook {
  googleBooksId: string
  title: string
  author?: string | null
  coverUrl?: string | null
  publishedDate?: string | null
  type?: string | null
  categories?: string[]
  genres?: string[]
}

function normalizeFavoriteBook(book: FavoriteBook): CatalogBook {
  return {
    googleBooksId: book.googleBooksId,
    title: book.title,
    author: book.author || null,
    authors: book.author ? [book.author] : [],
    type: book.type || 'livro',
    categories: Array.isArray(book.categories) ? book.categories : [],
    genres: Array.isArray(book.genres) ? book.genres : [],
    coverUrl: book.coverUrl || null,
    synopsis: null,
    publishedDate: book.publishedDate || null,
    previewLink: null,
    webReaderLink: null,
    embeddable: false,
    viewability: null,
  }
}

export interface SendMessageResponse {
  reply: string
  recommendations: BookRecommendation[]
  messageCount: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  recommendations?: BookRecommendation[]
  timestamp: string
}

export interface HistoryResponse {
  messages: ChatMessage[]
}

export const chatService = {
  /**
   * POST /chat/message
   * Envia mensagem do usuário e retorna resposta da IA + recomendações de livros.
   */
  sendMessage(message: string): Promise<SendMessageResponse> {
    return request<SendMessageResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  },

  /**
   * GET /chat/history
   * Retorna o histórico da última conversa do usuário.
   */
  getHistory(): Promise<HistoryResponse> {
    return request<HistoryResponse>('/chat/history')
  },

  /**
   * DELETE /chat/history
   * Limpa o histórico e inicia uma nova conversa.
   */
  clearHistory(): Promise<void> {
    return request<void>('/chat/history', { method: 'DELETE' })
  },

  /**
   * POST /chat/close
   * Encerra a conversa atual — salva preferências inferidas e sugestões no banco.
   * Deve ser chamado ao sair da tela de chat.
   */
  closeConversation(): Promise<void> {
    return request<void>('/chat/close', { method: 'POST' })
  },

  /**
   * GET /chat/preferences
   * Retorna as preferências do usuário.
   */
  getPreferences(): Promise<{ genres: string[]; types: string[]; favoriteAuthors: string[] }> {
    return request<{ genres: string[]; types: string[]; favoriteAuthors: string[] }>('/chat/preferences')
  },

  /**
   * PUT /chat/preferences
   * Atualiza as preferências do usuário.
   */
  updatePreferences(data: { genres?: string[]; types?: string[]; favoriteAuthors?: string[] }): Promise<{ message: string; preferences: { genres: string[]; types: string[]; favoriteAuthors: string[] } }> {
    return request<{ message: string; preferences: { genres: string[]; types: string[]; favoriteAuthors: string[] } }>('/chat/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * DELETE /chat/preferences
   * Reseta as preferências do usuário.
   */
  clearPreferences(): Promise<{ message: string; preferences: { genres: string[]; types: string[]; favoriteAuthors: string[] } }> {
    return request<{ message: string; preferences: { genres: string[]; types: string[]; favoriteAuthors: string[] } }>('/chat/preferences', {
      method: 'DELETE',
    })
  },
}

// ─── Books / Catálogo ────────────────────────────────────────────────────────

export const favoritesService = {
  async listFavorites(): Promise<CatalogBook[]> {
    const favorites = await request<FavoriteBook[]>('/favorites')
    return favorites.map(normalizeFavoriteBook)
  },

  addFavorite(book: CatalogBook): Promise<FavoriteBook> {
    return request<FavoriteBook>('/favorites', {
      method: 'POST',
      body: JSON.stringify({
        googleBooksId: book.googleBooksId,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        publishedDate: book.publishedDate,
        type: book.type,
        categories: book.categories,
        genres: book.genres,
      }),
    })
  },

  removeFavorite(googleBooksId: string): Promise<void> {
    return request<void>(`/favorites/${encodeURIComponent(googleBooksId)}`, {
      method: 'DELETE',
    })
  },
}

export interface ListBooksParams {
  search?: string
  author?: string
  publisher?: string
  category?: string
  theme?: string
  type?: string
  orderBy?: 'newest' | 'oldest' | 'relevance'
  yearFrom?: number
  yearTo?: number
  page?: number
  limit?: number
}

interface GoogleBookVolume {
  id?: string
  volumeInfo?: {
    title?: string
    authors?: string[]
    categories?: string[]
    description?: string
    publishedDate?: string
    previewLink?: string
    imageLinks?: {
      smallThumbnail?: string
      thumbnail?: string
      small?: string
      medium?: string
      large?: string
      extraLarge?: string
    }
  }
  accessInfo?: {
    embeddable?: boolean
    viewability?: string
    webReaderLink?: string
  }
}

interface GoogleBooksListResponse {
  totalItems?: number
  items?: GoogleBookVolume[]
}

interface OpenLibraryDoc {
  key?: string
  title?: string
  author_name?: string[]
  first_publish_year?: number
  subject?: string[]
  cover_i?: number
}

interface OpenLibrarySearchResponse {
  numFound?: number
  docs?: OpenLibraryDoc[]
}

interface OpenLibraryWork {
  key?: string
  title?: string
  authors?: Array<{
    author?: {
      key?: string
    }
  }>
  description?: string | { value?: string }
  subjects?: string[]
  covers?: number[]
  first_publish_date?: string
}

interface OpenLibraryAuthor {
  name?: string
  personal_name?: string
}

function toHttps(url?: string | null) {
  return typeof url === 'string' ? url.replace(/^http:\/\//, 'https://') : null
}

function normalizeGenres(categories: string[] = []) {
  return categories
    .map((category) => category.split('/')[0]?.trim())
    .filter((genre): genre is string => Boolean(genre))
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))))
}

export function mergeCatalogBookData(base: CatalogBook, enriched?: CatalogBook | null): CatalogBook {
  if (!enriched) {
    return base
  }

  const authors = uniqueValues([...(enriched.authors || []), ...(base.authors || [])])
  const categories = uniqueValues([...(enriched.categories || []), ...(base.categories || [])])
  const genres = uniqueValues([...(enriched.genres || []), ...(base.genres || [])])

  return {
    googleBooksId: enriched.googleBooksId || base.googleBooksId,
    title: enriched.title || base.title,
    author: enriched.author || base.author,
    authors,
    type: enriched.type || base.type,
    categories,
    genres,
    coverUrl: enriched.coverUrl || base.coverUrl,
    synopsis: enriched.synopsis || base.synopsis,
    publishedDate: enriched.publishedDate || base.publishedDate,
    previewLink: enriched.previewLink || base.previewLink,
    webReaderLink: enriched.webReaderLink || base.webReaderLink,
    embeddable: enriched.embeddable || base.embeddable,
    viewability: enriched.viewability || base.viewability,
  }
}

function normalizeGoogleBook(volume: GoogleBookVolume): CatalogBook {
  const info = volume.volumeInfo || {}
  const access = volume.accessInfo || {}
  const authors = Array.isArray(info.authors) ? info.authors : []
  const categories = Array.isArray(info.categories) ? info.categories : []
  const imageLinks = info.imageLinks || {}

  return {
    googleBooksId: volume.id || null,
    title: info.title || null,
    author: authors.length > 0 ? authors.join(', ') : null,
    authors,
    type: 'livro',
    categories,
    genres: normalizeGenres(categories),
    coverUrl: toHttps(
      imageLinks.extraLarge ||
        imageLinks.large ||
        imageLinks.medium ||
        imageLinks.small ||
        imageLinks.thumbnail ||
        imageLinks.smallThumbnail,
    ),
    synopsis: info.description || null,
    publishedDate: info.publishedDate || null,
    previewLink: toHttps(info.previewLink),
    webReaderLink: toHttps(access.webReaderLink),
    embeddable: Boolean(access.embeddable),
    viewability: access.viewability || null,
  }
}

function normalizeOpenLibraryDoc(doc: OpenLibraryDoc): CatalogBook {
  const id = doc.key?.replace('/works/', '') || null
  const categories = Array.isArray(doc.subject) ? doc.subject.slice(0, 8) : []
  const authors = Array.isArray(doc.author_name) ? doc.author_name.slice(0, 4) : []

  return {
    googleBooksId: id,
    title: doc.title || null,
    author: authors.length > 0 ? authors.join(', ') : null,
    authors,
    type: 'livro',
    categories,
    genres: normalizeGenres(categories),
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
    synopsis: null,
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
    previewLink: id ? `https://openlibrary.org/works/${id}` : null,
    webReaderLink: id ? `https://openlibrary.org/works/${id}` : null,
    embeddable: false,
    viewability: null,
  }
}

function normalizeOpenLibraryWork(work: OpenLibraryWork, id: string, authors: string[] = []): CatalogBook {
  const categories = Array.isArray(work.subjects) ? work.subjects.slice(0, 8) : []
  const description = typeof work.description === 'string'
    ? work.description
    : work.description?.value || null
  const coverId = Array.isArray(work.covers) ? work.covers[0] : null

  return {
    googleBooksId: id,
    title: work.title || null,
    author: authors.length > 0 ? authors.join(', ') : null,
    authors,
    type: 'livro',
    categories,
    genres: normalizeGenres(categories),
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
    synopsis: description,
    publishedDate: work.first_publish_date || null,
    previewLink: `https://openlibrary.org/works/${id}`,
    webReaderLink: `https://openlibrary.org/works/${id}`,
    embeddable: false,
    viewability: null,
  }
}

async function fetchOpenLibraryAuthors(work: OpenLibraryWork) {
  const authorKeys = (work.authors || [])
    .map((entry) => entry.author?.key)
    .filter((key): key is string => Boolean(key))
    .slice(0, 4)

  const authors = await Promise.all(
    authorKeys.map(async (key) => {
      const response = await fetch(`https://openlibrary.org${key}.json`)

      if (!response.ok) return null

      const author = await response.json() as OpenLibraryAuthor
      return author.name || author.personal_name || null
    }),
  )

  return authors.filter((author): author is string => Boolean(author))
}

async function requestGoogleVolume(id: string): Promise<CatalogBook> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}`,
      { signal: controller.signal },
    )

    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Livro não encontrado.' : 'Erro ao buscar livro.')
    }

    return normalizeGoogleBook(await response.json() as GoogleBookVolume)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Tempo de resposta excedido. Tente novamente em instantes.')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function requestOpenLibraryWork(id: string): Promise<CatalogBook> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://openlibrary.org/works/${encodeURIComponent(id)}.json`,
      { signal: controller.signal },
    )

    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Livro não encontrado.' : 'Erro ao buscar livro.')
    }

    const work = await response.json() as OpenLibraryWork
    const authors = await fetchOpenLibraryAuthors(work).catch(() => [])
    return normalizeOpenLibraryWork(work, id, authors)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Tempo de resposta excedido. Tente novamente em instantes.')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function requestOpenLibrarySearchFallback(book: CatalogBook): Promise<CatalogBook | null> {
  const query = book.title?.trim() || book.googleBooksId || ''
  if (!query) {
    return null
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const search = new URLSearchParams({
    q: query,
    limit: '5',
    fields: 'key,title,author_name,first_publish_year,subject,cover_i',
  })

  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?${search.toString()}`,
      { signal: controller.signal },
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json() as OpenLibrarySearchResponse
    const docs = data.docs || []
    const matchingDoc = docs.find((doc) => doc.key?.replace('/works/', '') === book.googleBooksId)

    return matchingDoc ? normalizeOpenLibraryDoc(matchingDoc) : null
  } catch {
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function requestOpenLibraryBook(id: string): Promise<CatalogBook> {
  const work = await requestOpenLibraryWork(id)

  if (work.publishedDate) {
    return work
  }

  const fallback = await requestOpenLibrarySearchFallback(work)
  return mergeCatalogBookData(work, fallback)
}

function buildGoogleBooksQuery(params: ListBooksParams) {
  const parts: string[] = []

  if (params.search?.trim()) {
    parts.push(params.search.trim())
  }

  if (params.author?.trim()) {
    parts.push(`inauthor:"${params.author.trim()}"`)
  }

  if (params.publisher?.trim()) {
    parts.push(`inpublisher:"${params.publisher.trim()}"`)
  }

  if (params.category?.trim()) {
    parts.push(`subject:${params.category.trim()}`)
  }

  if (params.theme?.trim()) {
    parts.push(`subject:${params.theme.trim()}`)
  }

  if (params.type === 'hq') {
    parts.push('subject:comics')
  } else if (params.type === 'manga') {
    parts.push('subject:manga')
  }

  return parts.join(' ').trim() || 'subject:fiction'
}

function getPublishedYear(book: CatalogBook) {
  const match = book.publishedDate?.match(/\d{4}/)
  return match ? Number(match[0]) : null
}

function hasYearFilter(params: ListBooksParams) {
  return typeof params.yearFrom === 'number' || typeof params.yearTo === 'number'
}

function buildOpenLibraryQuery(params: ListBooksParams) {
  const parts = [
    params.search?.trim() ||
      params.category?.trim() ||
      params.theme?.trim() ||
      'fiction',
  ]

  if (hasYearFilter(params)) {
    const from = params.yearFrom ?? '*'
    const to = params.yearTo ?? '*'
    parts.push(`first_publish_year:[${from} TO ${to}]`)
  }

  return parts.filter(Boolean).join(' ')
}

function isWithinYearFilter(book: CatalogBook, params: ListBooksParams) {
  if (!hasYearFilter(params)) {
    return true
  }

  const year = getPublishedYear(book)
  if (!year) {
    return false
  }

  if (typeof params.yearFrom === 'number' && year < params.yearFrom) {
    return false
  }

  if (typeof params.yearTo === 'number' && year > params.yearTo) {
    return false
  }

  return true
}

function sortBooks(books: CatalogBook[], orderBy?: ListBooksParams['orderBy']) {
  if (orderBy !== 'newest' && orderBy !== 'oldest') {
    return books
  }

  return [...books].sort((firstBook, secondBook) => {
    const firstYear = getPublishedYear(firstBook) || 0
    const secondYear = getPublishedYear(secondBook) || 0
    return orderBy === 'newest'
      ? secondYear - firstYear
      : firstYear - secondYear
  })
}

async function fetchGoogleCatalogBatch(params: ListBooksParams, startIndex: number, maxResults: number, signal: AbortSignal) {
  const query = new URLSearchParams({
    q: buildGoogleBooksQuery(params),
    startIndex: String(startIndex),
    maxResults: String(maxResults),
    langRestrict: 'pt',
    printType: 'books',
    orderBy: params.orderBy === 'newest' ? 'newest' : 'relevance',
  })

  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${query.toString()}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error('Erro ao carregar catálogo.')
  }

  return response.json() as Promise<GoogleBooksListResponse>
}

async function requestGoogleCatalog(params: ListBooksParams = {}): Promise<CatalogResponse> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const page = Number.isFinite(params.page) && Number(params.page) > 0 ? Number(params.page) : 1
  const limit = Math.min(
    Number.isFinite(params.limit) && Number(params.limit) > 0 ? Number(params.limit) : 15,
    40,
  )
  const startIndex = (page - 1) * limit
  const shouldScanCatalog = hasYearFilter(params) || params.orderBy === 'oldest'

  try {
    if (!shouldScanCatalog) {
      const data = await fetchGoogleCatalogBatch(params, startIndex, limit, controller.signal)

      return {
        items: (data.items || []).map(normalizeGoogleBook),
        page,
        limit,
        totalItems: Number.isFinite(data.totalItems) ? Number(data.totalItems) : 0,
      }
    }

    const targetItemCount = page * limit
    const batchSize = 40
    const maxScannedItems = 360
    let scannedItems = 0
    let sourceTotalItems = 0
    let exhausted = false
    const matchingBooks: CatalogBook[] = []

    while (matchingBooks.length < targetItemCount && scannedItems < maxScannedItems && !exhausted) {
      const data = await fetchGoogleCatalogBatch(params, scannedItems, batchSize, controller.signal)
      const volumes = data.items || []
      sourceTotalItems = Number.isFinite(data.totalItems) ? Number(data.totalItems) : sourceTotalItems

      matchingBooks.push(
        ...volumes
          .map(normalizeGoogleBook)
          .filter((book) => isWithinYearFilter(book, params)),
      )

      scannedItems += batchSize
      exhausted = volumes.length < batchSize || scannedItems >= sourceTotalItems
    }

    const sortedBooks = sortBooks(matchingBooks, params.orderBy)
    const items = sortedBooks.slice((page - 1) * limit, page * limit)
    const totalItems = exhausted
      ? sortedBooks.length
      : Math.max(sortedBooks.length, page * limit + 1)

    return {
      items,
      page,
      limit,
      totalItems,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Tempo de resposta excedido. Tente novamente em instantes.')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function requestOpenLibraryCatalog(params: ListBooksParams = {}): Promise<CatalogResponse> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const page = Number.isFinite(params.page) && Number(params.page) > 0 ? Number(params.page) : 1
  const limit = Math.min(
    Number.isFinite(params.limit) && Number(params.limit) > 0 ? Number(params.limit) : 15,
    100,
  )
  const query = buildOpenLibraryQuery(params)
  const search = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
    fields: 'key,title,author_name,first_publish_year,subject,cover_i',
  })

  if (params.author?.trim()) {
    search.set('author', params.author.trim())
  }

  if (params.publisher?.trim()) {
    search.set('publisher', params.publisher.trim())
  }

  if (params.orderBy === 'newest') {
    search.set('sort', 'new')
  } else if (params.orderBy === 'oldest') {
    search.set('sort', 'old')
  }

  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?${search.toString()}`,
      { signal: controller.signal },
    )

    if (!response.ok) {
      throw new Error('Erro ao carregar catálogo.')
    }

    const data = await response.json() as OpenLibrarySearchResponse

    const items = sortBooks(
      (data.docs || [])
        .map(normalizeOpenLibraryDoc)
        .filter((book) => book.googleBooksId)
        .filter((book) => isWithinYearFilter(book, params)),
      params.orderBy,
    )

    return {
      items,
      page,
      limit,
      totalItems: Number.isFinite(data.numFound) ? Number(data.numFound) : 0,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Tempo de resposta excedido. Tente novamente em instantes.')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const booksService = {
  /**
   * Lista livros do catálogo usando Google Books e Open Library como fallback.
   */
  listBooks(params: ListBooksParams = {}): Promise<CatalogResponse> {
    if (hasYearFilter(params)) {
      return requestOpenLibraryCatalog(params).catch(() => requestGoogleCatalog(params))
    }

    return requestGoogleCatalog(params).catch(() => requestOpenLibraryCatalog(params))
  },

  getBookById(id: string): Promise<CatalogBook> {
    if (/^OL\d+W$/i.test(id)) {
      return requestOpenLibraryBook(id)
    }

    return requestGoogleVolume(id).catch(() => requestOpenLibraryBook(id))
  },
}

export const catalogService = booksService

export interface BookEvaluation {
  id?: number
  googleBooksId: string
  title: string
  rating: number
  comment?: string | null
  createdAt?: string
}

export const evaluationsService = {
  /**
   * GET /avaliacoes
   * Retorna a lista de avaliações do usuário autenticado.
   */
  listEvaluations(): Promise<BookEvaluation[]> {
    return request<BookEvaluation[]>('/avaliacoes')
  },

  /**
   * POST /avaliacoes
   * Cria ou atualiza uma avaliação do usuário.
   */
  upsertEvaluation(data: { googleBooksId: string; title: string; rating: number; comment?: string }): Promise<BookEvaluation> {
    return request<BookEvaluation>('/avaliacoes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
