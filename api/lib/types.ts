import { VercelRequest, VercelResponse } from '@vercel/node'

export interface MinimalRequest {
  method?: string
  url?: string
  headers: Record<string, string>
  body?: any
}

export interface MinimalResponse {
  status: (code: number) => MinimalResponse
  json: (data: any) => void
  setHeader: (key: string, value: string) => void
  end?: (data?: string) => void
}

export type Handler = (req: MinimalRequest, res: MinimalResponse) => Promise<void>

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  conversationHistory?: Message[]
}

export interface ChatResponse {
  reply: string
}

export interface TranscribeRequest {
  audio: string | Buffer
}

export interface TranscribeResponse {
  text: string
  success: boolean
}

export interface SummarizeRequest {
  conversationHistory: Message[]
}

export interface SummarizeResponse {
  summary: string
}

export interface TTSRequest {
  text: string
  voice?: string
}

export interface TTSResponse {
  audio: string
  success: boolean
}

export interface ApiErrorResponse {
  error: string
  message?: string
  code?: string
}

export interface User {
  id: number
  username: string
  createdAt?: string
}

export interface ChatSessionRow {
  id: number
  user_id: number
  title: string
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessageRow {
  id: number
  chat_session_id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface SignupRequest {
  username: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  success: true
  user: User
}

export interface SessionsListResponse {
  sessions: ChatSession[]
}

export interface SessionDetailResponse {
  session: ChatSession
  messages: ChatMessage[]
}

export interface PostMessageRequest {
  message: string
}

export interface PostMessageResponse {
  reply: string
  userMessage: ChatMessage
  assistantMessage: ChatMessage
  session: ChatSession
}
