import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { ApiError, ErrorCodes } from './errors'
import { requireAuth } from './auth'
import {
  listSessions,
  createSession,
  getSessionWithMessages,
  renameSession,
  deleteSession,
  appendMessage,
  autoTitleFromFirstMessage,
  getLastMessagesForSession
} from './chatSessions'
import type { MinimalRequest, MinimalResponse, PostMessageRequest, SessionsListResponse, SessionDetailResponse, PostMessageResponse } from './types'

const __dirname = join(fileURLToPath(import.meta.url), '..')

function loadSystemPrompt(): string {
  try {
    const promptPath = join(__dirname, 'prompt.md')
    const content = readFileSync(promptPath, 'utf-8')
    return content.replace(/^# .*\n\n/, '')
  } catch (error) {
    console.warn('Failed to load prompt.md, using fallback', error)
    return `You are an expert English speaking coach. Your role is to help users improve their English speaking and writing skills by providing constructive feedback, suggestions, and explanations in a friendly and encouraging tone.`
  }
}

const SYSTEM_PROMPT = loadSystemPrompt()

export async function handleListSessions(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  const user = await requireAuth(req)
  const sessions = await listSessions(user.id)

  const response: SessionsListResponse = {
    sessions: sessions
  }
  res.status(200).json(response)
}

export async function handleCreateSession(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  const user = await requireAuth(req)
  const body = req.body || {}

  const session = await createSession(user.id, body.title)
  res.status(201).json({ session })
}

export async function handleGetSession(req: MinimalRequest, res: MinimalResponse, sessionId: number): Promise<void> {
  const user = await requireAuth(req)
  const { session, messages } = await getSessionWithMessages(user.id, sessionId)

  const response: SessionDetailResponse = {
    session,
    messages
  }
  res.status(200).json(response)
}

export async function handleRenameSession(req: MinimalRequest, res: MinimalResponse, sessionId: number): Promise<void> {
  const user = await requireAuth(req)
  const body = req.body || {}

  if (!body.title) {
    throw new ApiError(400, ErrorCodes.MISSING_PARAM, 'Title is required')
  }

  const session = await renameSession(user.id, sessionId, body.title)
  res.status(200).json({ session })
}

export async function handleDeleteSession(req: MinimalRequest, res: MinimalResponse, sessionId: number): Promise<void> {
  const user = await requireAuth(req)
  await deleteSession(user.id, sessionId)
  res.status(200).json({ success: true })
}

export async function handlePostSessionMessage(
  req: MinimalRequest,
  res: MinimalResponse,
  sessionId: number
): Promise<void> {
  const user = await requireAuth(req)
  const body = req.body as PostMessageRequest

  if (!body.message || !body.message.trim()) {
    throw new ApiError(400, ErrorCodes.MISSING_PARAM, 'Message is required')
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new ApiError(500, ErrorCodes.INTERNAL_ERROR, 'OpenAI API key not configured')
  }

  const sessionData = await getSessionWithMessages(user.id, sessionId)

  const userMessage = await appendMessage(sessionId, 'user', body.message)

  const history = await getLastMessagesForSession(sessionId)
  const messages = history.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }))

  const openai = new OpenAI({ apiKey })
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages],
    max_tokens: 500,
    temperature: 0.7
  })

  const reply = response.choices[0].message.content || 'I encountered an error processing your message.'

  const assistantMessage = await appendMessage(sessionId, 'assistant', reply)

  if (sessionData.session.title === 'New Conversation' && sessionData.messages.length === 0) {
    await autoTitleFromFirstMessage(sessionId)
  }

  const updatedSession = await getSessionWithMessages(user.id, sessionId)

  const responsePayload: PostMessageResponse = {
    reply,
    userMessage,
    assistantMessage,
    session: updatedSession.session
  }
  res.status(200).json(responsePayload)
}
