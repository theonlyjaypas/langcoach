import React from 'react';
import type { Message } from '../types';
import { Spinner } from './Spinner';
import { MessageActions } from './MessageActions';
import { parseMarkdownToJSX } from '../utils/markdown';

interface ChatInterfaceProps {
  messages: Message[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onDeleteMessage?: (id: string) => void;
  onPromptSelect?: (prompt: string) => void;
}

const SUGGESTED_PROMPTS = [
  {
    title: 'Improve Pronunciation',
    description: 'Get feedback on how you sound',
    starter: 'I would like to improve my pronunciation. Can you help me practice?',
  },
  {
    title: 'Grammar & Vocabulary',
    description: 'Learn better ways to express yourself',
    starter: 'Can you help me improve my grammar and expand my vocabulary?',
  },
  {
    title: 'Business English',
    description: 'Master professional communication',
    starter: 'I need help with business English for professional settings.',
  },
  {
    title: 'Conversational Practice',
    description: 'Improve fluency and natural speech',
    starter: 'Let\'s practice having a natural conversation.',
  },
];

const ChatInterface = React.memo(function ChatInterface({
  messages,
  loading,
  messagesEndRef,
  onDeleteMessage,
  onPromptSelect,
}: ChatInterfaceProps) {
  return (
    <div className="chat-messages">
      {messages.length === 0 ? (
        <div className="chat-empty">
          <div className="empty-content">
            <h2>Welcome to LangCoach</h2>
            <p className="empty-subtitle">Get personalized feedback on your English</p>
            <p className="empty-description">Start typing or recording to begin your English coaching session</p>

            <div className="suggested-prompts">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.title}
                  className="prompt-card"
                  onClick={() => onPromptSelect?.(prompt.starter)}
                  type="button"
                  aria-label={`${prompt.title}: ${prompt.description}`}
                >
                  <div className="prompt-title">{prompt.title}</div>
                  <div className="prompt-description">{prompt.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <section className="messages-list" role="region" aria-label="Chat messages">
          {messages.map((msg) => (
            <article
              key={msg.id}
              className={`message message-${msg.role}`}
              role="article"
            >
              <div className="message-header">
                <div className="message-badge">{msg.role === 'user' ? 'You' : 'Coach'}</div>
                {msg.type === 'voice' && msg.role === 'user' && (
                  <div className="voice-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    Voice
                  </div>
                )}
              </div>
              <div className="message-content">
                {parseMarkdownToJSX(msg.content)}
              </div>
              <div className="message-footer">
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
                {onDeleteMessage && (
                  <MessageActions
                    content={msg.content}
                    onDelete={() => onDeleteMessage(msg.id)}
                  />
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {loading && (
        <div className="message message-assistant" aria-live="polite">
          <div className="message-badge">Coach</div>
          <div className="message-loading">
            <Spinner size="sm" label="Coach is thinking..." />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  );
});

export default ChatInterface;
