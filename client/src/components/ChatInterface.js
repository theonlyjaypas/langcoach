export default function ChatInterface({ messages, loading, messagesEndRef }) {
    return (<div className="chat-messages">
      {messages.length === 0 ? (<div className="chat-empty">
          <p>Start by typing or recording a message to begin your English coaching session.</p>
        </div>) : (messages.map(msg => (<div key={msg.id} className={`message message-${msg.role}`}>
            <div className="message-header">
              <div className="message-badge">{msg.role === 'user' ? 'You' : 'Coach'}</div>
              {msg.type === 'voice' && msg.role === 'user' && (<div className="voice-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  Voice
                </div>)}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
            <div className="message-time">
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>)))}

      {loading && (<div className="message message-assistant">
          <div className="message-badge">Coach</div>
          <div className="message-loading">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>)}

      <div ref={messagesEndRef}/>
    </div>);
}
