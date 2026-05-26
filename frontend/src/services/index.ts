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

export const authService = {
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
}

// ─── Books / Catálogo ────────────────────────────────────────────────────────

export interface ListBooksParams {
  search?: string
  author?: string
  category?: string
  theme?: string
  type?: string
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

function buildGoogleBooksQuery(params: ListBooksParams) {
  const parts: string[] = []

  if (params.search?.trim()) {
    parts.push(params.search.trim())
  }

  if (params.author?.trim()) {
    parts.push(`inauthor:"${params.author.trim()}"`)
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

async function requestGoogleCatalog(params: ListBooksParams = {}): Promise<CatalogResponse> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const page = Number.isFinite(params.page) && Number(params.page) > 0 ? Number(params.page) : 1
  const limit = Math.min(
    Number.isFinite(params.limit) && Number(params.limit) > 0 ? Number(params.limit) : 15,
    40,
  )
  const startIndex = (page - 1) * limit
  const query = new URLSearchParams({
    q: buildGoogleBooksQuery(params),
    startIndex: String(startIndex),
    maxResults: String(limit),
    langRestrict: 'pt',
    printType: 'books',
  })

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${query.toString()}`,
      { signal: controller.signal },
    )

    if (!response.ok) {
      throw new Error('Erro ao carregar catálogo.')
    }

    const data = await response.json() as GoogleBooksListResponse

    return {
      items: (data.items || []).map(normalizeGoogleBook),
      page,
      limit,
      totalItems: Number.isFinite(data.totalItems) ? Number(data.totalItems) : 0,
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
  const query = params.search?.trim() || params.category?.trim() || params.theme?.trim() || 'ficcao'
  const search = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
    fields: 'key,title,author_name,first_publish_year,subject,cover_i',
  })

  if (params.author?.trim()) {
    search.set('author', params.author.trim())
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

    return {
      items: (data.docs || []).map(normalizeOpenLibraryDoc).filter((book) => book.googleBooksId),
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
    return requestGoogleCatalog(params).catch(() => requestOpenLibraryCatalog(params))
  },

  getBookById(id: string): Promise<CatalogBook> {
    if (/^OL\d+W$/i.test(id)) {
      return requestOpenLibraryWork(id)
    }

    return requestGoogleVolume(id).catch(() => requestOpenLibraryWork(id))
  },
}

export const catalogService = booksService
