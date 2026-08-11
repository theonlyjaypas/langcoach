import { useState, useCallback } from 'react'
import { api } from '../utils/api'
import type { ChatSession, ChatMessage } from '../types'

export interface UseSessionsManagerState {
  sessions: ChatSession[]
  activeSessionId: number | null
  isLoadingSessions: boolean
  refreshSessions: () => Promise<void>
  selectSession: (sessionId: number) => Promise<ChatMessage[]>
  createNewSession: () => Promise<ChatSession>
  renameSession: (sessionId: number, title: string) => Promise<ChatSession>
  deleteSession: (sessionId: number) => Promise<void>
  loadSessionMessages: (sessionId: number) => Promise<ChatMessage[]>
}

export function useSessionsManager(): UseSessionsManagerState {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  const refreshSessions = useCallback(async () => {
    setIsLoadingSessions(true)
    try {
      const { sessions } = await api.listSessions()
      setSessions(sessions)
    } finally {
      setIsLoadingSessions(false)
    }
  }, [])

  const selectSession = useCallback(
    async (sessionId: number) => {
      setActiveSessionId(sessionId)
      const { messages } = await api.getSession(sessionId)
      return messages
    },
    []
  )

  const createNewSession = useCallback(async () => {
    const { session } = await api.createSession()
    setActiveSessionId(session.id)
    await refreshSessions()
    return session
  }, [refreshSessions])

  const renameSession = useCallback(
    async (sessionId: number, title: string) => {
      const { session } = await api.renameSession(sessionId, title)
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: session.title } : s))
      )
      return session
    },
    []
  )

  const deleteSession = useCallback(async (sessionId: number) => {
    await api.deleteSession(sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      setActiveSessionId(null)
    }
  }, [activeSessionId])

  const loadSessionMessages = useCallback(async (sessionId: number) => {
    const { messages } = await api.getSession(sessionId)
    return messages
  }, [])

  return {
    sessions,
    activeSessionId,
    isLoadingSessions,
    refreshSessions,
    selectSession,
    createNewSession,
    renameSession,
    deleteSession,
    loadSessionMessages
  }
}
