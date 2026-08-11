import { sql } from './db'
import { ApiError, ErrorCodes } from './errors'
import type { ChatSession, ChatMessage, ChatSessionRow, ChatMessageRow } from './types'

export async function listSessions(userId: number): Promise<ChatSession[]> {
  const result = await sql`
    SELECT id, title, created_at, updated_at
    FROM chat_sessions
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `

  return (result as unknown as ChatSessionRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

export async function createSession(userId: number, title?: string): Promise<ChatSession> {
  const finalTitle = title || 'New Conversation'

  const result = await sql`
    INSERT INTO chat_sessions (user_id, title)
    VALUES (${userId}, ${finalTitle})
    RETURNING id, title, created_at, updated_at
  `

  const row = result[0] as ChatSessionRow
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export async function getSessionWithMessages(
  userId: number,
  sessionId: number
): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
  const sessionResult = await sql`
    SELECT id, title, created_at, updated_at
    FROM chat_sessions
    WHERE id = ${sessionId} AND user_id = ${userId}
  `

  if (sessionResult.length === 0) {
    throw new ApiError(404, ErrorCodes.NOT_FOUND, 'Chat session not found')
  }

  const sessionRow = sessionResult[0] as ChatSessionRow
  const session: ChatSession = {
    id: sessionRow.id,
    title: sessionRow.title,
    createdAt: sessionRow.created_at,
    updatedAt: sessionRow.updated_at
  }

  const messagesResult = await sql`
    SELECT id, role, content, created_at
    FROM chat_messages
    WHERE chat_session_id = ${sessionId}
    ORDER BY created_at ASC
  `

  const messages: ChatMessage[] = (messagesResult as unknown as ChatMessageRow[]).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at
  }))

  return { session, messages }
}

export async function renameSession(userId: number, sessionId: number, title: string): Promise<ChatSession> {
  const result = await sql`
    UPDATE chat_sessions
    SET title = ${title}, updated_at = now()
    WHERE id = ${sessionId} AND user_id = ${userId}
    RETURNING id, title, created_at, updated_at
  `

  if (result.length === 0) {
    throw new ApiError(404, ErrorCodes.NOT_FOUND, 'Chat session not found')
  }

  const row = result[0] as ChatSessionRow
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export async function deleteSession(userId: number, sessionId: number): Promise<void> {
  const result = await sql`
    DELETE FROM chat_sessions
    WHERE id = ${sessionId} AND user_id = ${userId}
  `

  if (result.count === 0) {
    throw new ApiError(404, ErrorCodes.NOT_FOUND, 'Chat session not found')
  }
}

export async function appendMessage(
  sessionId: number,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage> {
  const result = await sql`
    INSERT INTO chat_messages (chat_session_id, role, content)
    VALUES (${sessionId}, ${role}, ${content})
    RETURNING id, role, content, created_at
  `

  await sql`
    UPDATE chat_sessions SET updated_at = now() WHERE id = ${sessionId}
  `

  const row = result[0] as ChatMessageRow
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at
  }
}

export async function autoTitleFromFirstMessage(sessionId: number): Promise<void> {
  const existing = await sql`
    SELECT title FROM chat_sessions WHERE id = ${sessionId}
  `

  if (existing.length === 0 || existing[0].title !== 'New Conversation') {
    return
  }

  const firstMessage = await sql`
    SELECT content FROM chat_messages
    WHERE chat_session_id = ${sessionId} AND role = 'user'
    ORDER BY created_at ASC
    LIMIT 1
  `

  if (firstMessage.length === 0) {
    return
  }

  const content = firstMessage[0].content
  const title = content.length > 50 ? content.substring(0, 50) + '...' : content

  await sql`
    UPDATE chat_sessions SET title = ${title} WHERE id = ${sessionId}
  `
}

export async function getLastMessagesForSession(sessionId: number): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const result = await sql`
    SELECT role, content FROM chat_messages
    WHERE chat_session_id = ${sessionId}
    ORDER BY created_at ASC
  `

  return (result as unknown as ChatMessageRow[]).map((row) => ({
    role: row.role,
    content: row.content
  }))
}
