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
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`
  }

  let response: Response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Tempo de resposta excedido. Tente novamente em instantes.')
    }

    throw new Error('Não foi possível conectar ao servidor.')
  } finally {
    window.clearTimeout(timeoutId)
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

export interface RegisterResponse {
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

  register(name: string, email: string, password: string): Promise<RegisterResponse> {
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
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
