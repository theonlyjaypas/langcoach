import { VercelRequest, VercelResponse } from '@vercel/node'

export type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>

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
