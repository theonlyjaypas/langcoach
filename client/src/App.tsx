import { useState, useRef, useEffect, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import VoiceRecorder from './components/VoiceRecorder';
import Login from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/Toast';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useConversationExport } from './hooks/useConversationExport';
import type { Message, LoadingState } from './types';
import './App.css';

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('authToken') === 'authenticated';
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const [loading, setLoading] = useState<LoadingState>({
    chat: false,
    transcript: false,
    takeaways: false,
    auth: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { show: showToast } = useToast();
  const { play: speakText } = useAudioPlayback();
  const { exportAsMarkdown } = useConversationExport();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setMessages([]);
      showToast('Logged out successfully', 'success');
    }
  }, [showToast]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleClearChat = useCallback(() => {
    if (messages.length === 0) {
      showToast('No conversation to clear', 'info');
      return;
    }

    if (confirm('Clear all messages? This cannot be undone.')) {
      setMessages([]);
      showToast('Conversation cleared', 'success');
    }
  }, [messages.length, showToast]);

  useEffect(() => {
    const scrollContainer = messagesEndRef.current?.parentElement;
    if (!scrollContainer) return;

    const isAtBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;

    if (isAtBottom && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages[messages.length - 1]?.timestamp]);

  const handleTranscript = useCallback(() => {
    if (messages.length === 0) {
      showToast('No conversation to download. Start chatting with the coach first!', 'warning');
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, transcript: true }));
      exportAsMarkdown(messages);
      showToast('Transcript downloaded', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to generate transcript',
        'error'
      );
    } finally {
      setLoading((prev) => ({ ...prev, transcript: false }));
    }
  }, [messages, showToast, exportAsMarkdown]);

  const handleKeyTakeaways = useCallback(async () => {
    if (messages.length === 0) {
      showToast('No conversation yet. Start chatting with the coach first!', 'warning');
      return;
    }

    setLoading((prev) => ({ ...prev, takeaways: true }));
    try {
      abortControllerRef.current = new AbortController();
      const conversationText = messages
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
        .join('\n\n');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on our conversation, please provide the key takeaways from this English coaching session. Format them as a clear, numbered list.\n\nConversation:\n${conversationText}`,
          conversationHistory: messages,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate takeaways');
      }

      const data = await response.json();

      const takeawaysMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        type: 'text',
      };

      setMessages((prev) => [...prev, takeawaysMessage]);
      showToast('Takeaways generated', 'success');
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showToast(
          error instanceof Error ? error.message : 'Failed to generate takeaways',
          'error'
        );
      }
    } finally {
      setLoading((prev) => ({ ...prev, takeaways: false }));
    }
  }, [messages, showToast]);

  const sendMessage = useCallback(
    async (content: string, type: 'text' | 'voice' = 'text') => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
        type,
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading((prev) => ({ ...prev, chat: true }));

      try {
        abortControllerRef.current = new AbortController();
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversationHistory: messages,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          type: 'text',
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (inputMode === 'voice') {
          await speakText(data.reply);
        }

        showToast('Message received', 'success');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          showToast(
            error instanceof Error ? error.message : 'Failed to send message',
            'error'
          );
        }
      } finally {
        setLoading((prev) => ({ ...prev, chat: false }));
      }
    },
    [inputMode, messages, showToast, speakText]
  );

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-buttons">
          <button
            onClick={handleTranscript}
            disabled={loading.transcript || messages.length === 0}
            className="summarize-btn"
            title="Download conversation transcript"
            aria-label="Download transcript"
          >
            {loading.transcript ? 'Downloading...' : 'Transcript'}
          </button>
          <button
            onClick={handleKeyTakeaways}
            disabled={loading.takeaways || messages.length === 0}
            className="takeaways-btn"
            title="Generate key takeaways from the conversation"
            aria-label="Generate takeaways"
          >
            {loading.takeaways ? 'Generating...' : 'Key Takeaways'}
          </button>
          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="clear-chat-btn"
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            Clear Chat
          </button>
        </div>
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
            Logout
          </button>
        </div>
      </header>

      <main className="chat-main">
        <ChatInterface
          messages={messages}
          loading={loading.chat}
          messagesEndRef={messagesEndRef}
          onDeleteMessage={(id) => {
            setMessages((prev) => prev.filter((m) => m.id !== id));
            showToast('Message deleted', 'info');
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
  );
}
