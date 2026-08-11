import type { User, LoginResponse, ChatSession, ChatMessage } from '../types'

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const API_BASE = import.meta.env.VITE_API_URL || ''

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, data.code || 'UNKNOWN_ERROR', data.error || 'Unknown error')
  }

  return data as T
}

export const api = {
  async signup(username: string, password: string): Promise<{ success: true; user: User }> {
    return fetchJson('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    return fetchJson('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },

  async logout(): Promise<{ success: true }> {
    return fetchJson('/api/logout', { method: 'POST' })
  },

  async getMe(): Promise<{ user: User }> {
    return fetchJson('/api/me')
  },

  async listSessions(): Promise<{ sessions: ChatSession[] }> {
    return fetchJson('/api/sessions')
  },

  async createSession(title?: string): Promise<{ session: ChatSession }> {
    return fetchJson('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title })
    })
  },

  async getSession(sessionId: number): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
    return fetchJson(`/api/sessions/${sessionId}`)
  },

  async renameSession(sessionId: number, title: string): Promise<{ session: ChatSession }> {
    return fetchJson(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title })
    })
  },

  async deleteSession(sessionId: number): Promise<{ success: true }> {
    return fetchJson(`/api/sessions/${sessionId}`, { method: 'DELETE' })
  },

  async postSessionMessage(
    sessionId: number,
    message: string
  ): Promise<{
    reply: string
    userMessage: ChatMessage
    assistantMessage: ChatMessage
    session: ChatSession
  }> {
    return fetchJson(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    })
  }
}

export { ApiError }
