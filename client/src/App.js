import { useState, useRef, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import VoiceRecorder from './components/VoiceRecorder';
import Login from './components/Login';
import './App.css';
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('authToken') === 'authenticated';
    });
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [generatingTakeaways, setGeneratingTakeaways] = useState(false);
    const [inputMode, setInputMode] = useState('text');
    const messagesEndRef = useRef(null);
    const currentAudioRef = useRef(null);
    const handleLogin = () => {
        setIsAuthenticated(true);
    };
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setMessages([]);
    };
    const speakText = async (text) => {
        return new Promise((resolve) => {
            try {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
                if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current.currentTime = 0;
                }
                fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                })
                    .then(response => {
                    if (!response.ok) {
                        console.error('Failed to generate speech');
                        resolve();
                        return;
                    }
                    return response.json();
                })
                    .then(data => {
                    if (!data) {
                        resolve();
                        return;
                    }
                    const audioData = `data:audio/mpeg;base64,${data.audio}`;
                    const audio = new Audio(audioData);
                    currentAudioRef.current = audio;
                    audio.volume = 1.0;
                    audio.onended = () => {
                        console.log('Audio playback finished');
                        resolve();
                    };
                    audio.onerror = () => {
                        console.error('Audio playback error');
                        resolve();
                    };
                    audio.play().catch(error => {
                        console.error('Error playing audio:', error);
                        resolve();
                    });
                })
                    .catch(error => {
                    console.error('Text-to-speech error:', error);
                    resolve();
                });
            }
            catch (error) {
                console.error('Text-to-speech error:', error);
                resolve();
            }
        });
    };
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const handleTranscript = () => {
        if (messages.length === 0) {
            alert('No conversation to download. Start chatting with the coach first!');
            return;
        }
        setSummarizing(true);
        try {
            const timestamp = new Date().toLocaleString();
            const markdown = generateMarkdownSummary(messages, timestamp);
            downloadMarkdownFile(markdown);
        }
        catch (error) {
            console.error('Error:', error);
            alert('Failed to generate transcript.');
        }
        finally {
            setSummarizing(false);
        }
    };
    const handleKeyTakeaways = async () => {
        if (messages.length === 0) {
            alert('No conversation yet. Start chatting with the coach first!');
            return;
        }
        setGeneratingTakeaways(true);
        try {
            const conversationText = messages
                .map(msg => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
                .join('\n\n');
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Based on our conversation, please provide the key takeaways from this English coaching session. Format them as a clear, numbered list.\n\nConversation:\n${conversationText}`,
                    conversationHistory: messages
                })
            });
            if (!response.ok)
                throw new Error('Failed to generate takeaways');
            const data = await response.json();
            const takeawaysMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
                type: 'text'
            };
            setMessages(prev => [...prev, takeawaysMessage]);
        }
        catch (error) {
            console.error('Error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error generating key takeaways. Please try again.',
                timestamp: new Date(),
                type: 'text'
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        finally {
            setGeneratingTakeaways(false);
        }
    };
    const generateMarkdownSummary = (messages, timestamp) => {
        const conversationLines = messages.map(msg => {
            const role = msg.role === 'user' ? 'You' : 'Coach';
            return `**${role}:** ${msg.content}\n`;
        }).join('\n');
        return `# English Coaching Session Summary

**Generated:** ${timestamp}
**Total Messages:** ${messages.length}

---

## Conversation

${conversationLines}

---

## Statistics

- **Total Messages:** ${messages.length}
- **User Messages:** ${messages.filter(m => m.role === 'user').length}
- **Coach Messages:** ${messages.filter(m => m.role === 'assistant').length}
- **Session Duration:** ${getSessionDuration(messages)}

---

*Downloaded from English Speaking Coach*
`;
    };
    const getSessionDuration = (messages) => {
        if (messages.length === 0)
            return 'N/A';
        const firstMsg = messages[0];
        const lastMsg = messages[messages.length - 1];
        const duration = lastMsg.timestamp.getTime() - firstMsg.timestamp.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };
    const downloadMarkdownFile = (content) => {
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = 'transcript.md';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
    };
    const sendMessage = async (content, type = 'text') => {
        if (!content.trim())
            return;
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
            type
        };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    conversationHistory: messages
                })
            });
            if (!response.ok)
                throw new Error('Failed to get response');
            const data = await response.json();
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
                type: 'text'
            };
            if (inputMode === 'voice') {
                await speakText(data.reply);
                setMessages(prev => [...prev, assistantMessage]);
            }
            else {
                setMessages(prev => [...prev, assistantMessage]);
            }
        }
        catch (error) {
            console.error('Error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                type: 'text'
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        finally {
            setLoading(false);
        }
    };
    if (!isAuthenticated) {
        return <Login onLogin={handleLogin}/>;
    }
    return (<div className="app-container">
      <header className="app-header">
        <div className="header-buttons">
          <button onClick={handleTranscript} disabled={summarizing || messages.length === 0} className="summarize-btn" title="Download conversation transcript">
            {summarizing ? 'Downloading...' : 'Transcript'}
          </button>
          <button onClick={handleKeyTakeaways} disabled={generatingTakeaways || messages.length === 0} className="takeaways-btn" title="Generate key takeaways from the conversation">
            {generatingTakeaways ? 'Generating...' : 'Key Takeaways'}
          </button>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            Logout
          </button>
        </div>
        <h1>LangCoach</h1>
        <p>Improve your English with AI-powered coaching</p>
      </header>

      <main className="chat-main">
        <ChatInterface messages={messages} loading={loading} messagesEndRef={messagesEndRef}/>
        <VoiceRecorder onMessage={sendMessage} loading={loading} onModeChange={setInputMode}/>
      </main>
    </div>);
}
