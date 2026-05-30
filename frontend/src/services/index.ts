// src/services/index.ts
// Serviço centralizado de comunicação com a API do backend.
// Todas as requisições passam pelo proxy Vite (/api → http://localhost:3001).

import router from '@/router'
import { useAuthStore } from '@/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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

  if (response.status === 401) {
    auth.clearToken()
    if (router.currentRoute.value.path !== '/login') {
      router.replace({
        path: '/login',
        query: { redirect: router.currentRoute.value.fullPath },
      })
    }
    throw new Error('Sessao expirada. Faca login novamente.')
  }

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

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string
  text: string
  options: string[]
}

export interface QuizStartResponse {
  sessionId: string
  maxQuestions: number
  questions: QuizQuestion[]
  questionNumber: number
  canFinish: boolean
}

export interface QuizAnswerResponse {
  sessionId: string
  answeredCount: number
  maxQuestions: number
  question: QuizQuestion | null
  canFinish: boolean
  isComplete: boolean
}

export interface QuizRecommendation extends BookRecommendation {
  type?: string
  justification?: string
  sensitiveContent?: boolean
}

export interface QuizPreferences {
  genres: string[]
  types: string[]
  favoriteAuthors: string[]
}

export interface QuizFinishResponse {
  message: string
  preferences: QuizPreferences
  recommendations: QuizRecommendation[]
  preferencesSaved: boolean
}

// ─── Catálogo (Google Books) ───────────────────────────────────────────────────

export interface CatalogItem {
  googleBooksId: string | null
  title: string | null
  author: string | null
  authors: string[]
  type: string
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
  items: CatalogItem[]
  page: number
  limit: number
  totalItems: number
}

export interface CatalogFilters {
  search?: string
  author?: string
  category?: string
  theme?: string
  type?: string
  page?: number
  limit?: number
}

export const bookService = {
  /**
   * GET /books
   * Lista livros do catálogo Google Books com filtros opcionais.
   */
  list(filters: CatalogFilters = {}): Promise<CatalogResponse> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    }
    const query = params.toString()
    return request<CatalogResponse>(`/books${query ? `?${query}` : ''}`)
  },
}

export const quizService = {
  /**
   * POST /quiz/start
   * Cria uma nova sessão e devolve as 3 perguntas genéricas iniciais.
   */
  start(): Promise<QuizStartResponse> {
    return request<QuizStartResponse>('/quiz/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },

  /**
   * POST /quiz/answer
   * Registra a resposta e devolve a próxima pergunta (gerada pela IA após a 3ª).
   */
  answer(sessionId: string, questionId: string, answer: string): Promise<QuizAnswerResponse> {
    return request<QuizAnswerResponse>('/quiz/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionId, answer }),
    })
  },

  /**
   * POST /quiz/regenerate
   * Pede para a IA gerar uma nova pergunta no slot atual (apenas perguntas adaptativas).
   */
  regenerate(sessionId: string): Promise<QuizAnswerResponse> {
    return request<QuizAnswerResponse>('/quiz/regenerate', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    })
  },

  /**
   * POST /quiz/finish
   * Encerra a sessão e devolve preferências inferidas + recomendações.
   */
  finish(sessionId: string, savePreferences = true): Promise<QuizFinishResponse> {
    return request<QuizFinishResponse>('/quiz/finish', {
      method: 'POST',
      body: JSON.stringify({ sessionId, savePreferences }),
    })
  },
}
