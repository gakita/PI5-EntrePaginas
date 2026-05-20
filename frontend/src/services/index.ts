// src/services/index.ts
// Serviço centralizado de comunicação com a API do backend.
// Todas as requisições passam pelo proxy Vite (/api → http://localhost:3001).

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
