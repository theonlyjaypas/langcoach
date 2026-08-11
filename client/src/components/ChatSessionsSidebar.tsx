import { useState, useRef } from 'react'
import type { ChatSession } from '../types'
import './ChatSessionsSidebar.css'

interface ChatSessionsSidebarProps {
  sessions: ChatSession[]
  activeSessionId: number | null
  onSelectSession: (sessionId: number) => void
  onCreateSession: () => void
  onRenameSession: (sessionId: number, title: string) => void
  onDeleteSession: (sessionId: number) => void
  isLoading: boolean
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export default function ChatSessionsSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  isLoading
}: ChatSessionsSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditingTitle(session.title)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  const handleSaveEdit = async (sessionId: number) => {
    if (editingTitle.trim()) {
      await onRenameSession(sessionId, editingTitle.trim())
    }
    setEditingSessionId(null)
  }

  const handleDeleteWithConfirm = (sessionId: number) => {
    if (confirm('Delete this conversation?')) {
      onDeleteSession(sessionId)
    }
  }

  return (
    <aside className="sessions-sidebar">
      <div className="sidebar-header">
        <h2>Conversations</h2>
        <button
          onClick={onCreateSession}
          disabled={isLoading}
          className="new-session-btn"
          title="Start a new conversation"
        >
          + New
        </button>
      </div>

      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="no-sessions">
            <p>No conversations yet</p>
            <p className="hint">Start a new one to begin</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${activeSessionId === session.id ? 'active' : ''}`}
            >
              {editingSessionId === session.id ? (
                <div className="session-edit">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(session.id)
                      if (e.key === 'Escape') setEditingSessionId(null)
                    }}
                    className="session-edit-input"
                  />
                </div>
              ) : (
                <div
                  className="session-content"
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="session-title">{session.title}</div>
                  <div className="session-time">{formatRelativeTime(session.updatedAt)}</div>
                </div>
              )}

              {activeSessionId === session.id && editingSessionId !== session.id && (
                <div className="session-actions">
                  <button
                    onClick={() => handleStartEdit(session)}
                    className="action-btn"
                    title="Rename"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteWithConfirm(session.id)}
                    className="action-btn delete"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
