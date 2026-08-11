import { useState, useRef, useEffect, useCallback } from 'react'
import ChatInterface from './components/ChatInterface'
import VoiceRecorder from './components/VoiceRecorder'
import Login from './components/Login'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider, useToast } from './components/Toast'
import { useAudioPlayback } from './hooks/useAudioPlayback'
import { api, ApiError } from './utils/api'
import type { Message, LoadingState, User } from './types'
import './App.css'

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  )
}

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored as 'light' | 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })
  const [loading, setLoading] = useState<LoadingState>({
    chat: false,
    transcript: false,
    takeaways: false,
    auth: false,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { show: showToast } = useToast()
  const { play: speakText } = useAudioPlayback()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await api.getMe()
        setCurrentUser(user)
        setAuthStatus('authenticated')
      } catch (error) {
        setAuthStatus('unauthenticated')
      }
    }
    checkAuth()
  }, [])

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user)
    setAuthStatus('authenticated')
    showToast('Logged in successfully', 'success')
  }, [showToast])

  const handleLogout = useCallback(async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await api.logout()
        setCurrentUser(null)
        setAuthStatus('unauthenticated')
        setMessages([])
        showToast('Logged out successfully', 'success')
      } catch (error) {
        showToast('Logout failed', 'error')
      }
    }
  }, [showToast])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  useEffect(() => {
    const scrollContainer = messagesEndRef.current?.parentElement
    if (!scrollContainer) return

    const isAtBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100

    if (isAtBottom && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages[messages.length - 1]?.timestamp])

  const sendMessage = useCallback(
    async (content: string, type: 'text' | 'voice' = 'text') => {
      if (!content.trim()) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
        type,
      }

      setMessages((prev) => [...prev, userMessage])
      setLoading((prev) => ({ ...prev, chat: true }))

      try {
        abortControllerRef.current = new AbortController()
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: content,
            conversationHistory: messages,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to get response')
        }

        const data = await response.json()

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          type: 'text',
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (inputMode === 'voice') {
          await speakText(data.reply)
        }

        showToast('Message received', 'success')
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          showToast(
            error instanceof Error ? error.message : 'Failed to send message',
            'error'
          )
        }
      } finally {
        setLoading((prev) => ({ ...prev, chat: false }))
      }
    },
    [inputMode, showToast, speakText, messages]
  )

  if (authStatus === 'checking') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (authStatus === 'unauthenticated') {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <h1>LangCoach</h1>
        <p>Improve your English with AI-powered coaching</p>
        <div className="header-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title="Toggle dark mode"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleLogout}
            className="logout-btn"
            title="Logout"
            aria-label="Logout"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <main className="chat-main">
        <ChatInterface
          messages={messages}
          loading={loading.chat}
          messagesEndRef={messagesEndRef}
          onDeleteMessage={(id) => {
            setMessages((prev) => prev.filter((m) => m.id !== id))
            showToast('Message deleted', 'info')
          }}
          onPromptSelect={(prompt) => sendMessage(prompt)}
        />
        <VoiceRecorder
          onMessage={sendMessage}
          loading={loading.chat}
          onModeChange={setInputMode}
        />
      </main>
    </div>
  )
}
