# LangCoach

An AI-powered English language coaching application with voice and text modes, featuring natural-sounding voice responses and compassionate feedback.

**Improve your English with AI-powered coaching**

## Features

- **Dual Input Modes**: Text or voice input for flexibility
- **Natural Voice Responses**: ElevenLabs text-to-speech for human-like coach responses
- **Voice Transcription**: OpenAI Whisper for accurate speech-to-text conversion
- **Intelligent Coaching**: GPT-powered compassionate feedback and language guidance
- **Session Management**: 
  - Secure login with credentials
  - Download conversation transcripts
  - Generate key takeaways automatically
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Real-time Chat**: Instant feedback and interactive practice

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Custom CSS with responsive design
- **Backend**: Node.js with development server
- **APIs**: 
  - OpenAI GPT-4 (coaching responses)
  - OpenAI Whisper (voice transcription)
  - ElevenLabs (text-to-speech with natural voices)
- **Development**: Concurrently running client and API servers

## Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (https://platform.openai.com/api-keys)
- ElevenLabs API key (https://elevenlabs.io)

## Project Structure

```
english-coach/
├── client/                      # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx        # Authentication component
│   │   │   ├── ChatInterface.tsx # Message display
│   │   │   └── VoiceRecorder.tsx # Voice input & mode toggle
│   │   ├── styles/
│   │   │   ├── Login.css        # Login page styles
│   │   │   └── App.css          # Main app styles
│   │   ├── App.tsx              # Main application
│   │   └── main.tsx             # Entry point
│   ├── .env                     # Frontend env variables
│   ├── vite.config.ts
│   └── package.json
├── api/                         # Backend (Node.js)
│   ├── routes/
│   │   ├── chat.ts             # Chat endpoint
│   │   ├── transcribe.ts       # Voice transcription
│   │   └── tts.ts              # Text-to-speech
│   ├── dev.ts                  # Development server
│   ├── prompt.md               # Coach system prompt
│   ├── .env                    # Backend env variables
│   └── package.json
└── package.json                # Root workspace config
```

## Setup

### 1. Install Dependencies

```bash
npm install
cd client && npm install
cd ../api && npm install
cd ..
```

### 2. Configure Environment Variables

#### Root `./.env`
```
OPENAI_API_KEY=sk_your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_ID=admin
VITE_PASSWORD=your_secure_password
```

#### Client `./client/.env`
```
VITE_ID=admin
VITE_PASSWORD=your_secure_password
```

#### API `./api/.env`
```
OPENAI_API_KEY=sk_your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_ID=admin
VITE_PASSWORD=your_secure_password
```

### 3. Run Locally

```bash
# From root directory - starts both client and API
npm run dev
```

This will start:
- **Frontend**: http://localhost:5176 (Vite dev server)
- **Backend API**: http://localhost:3001 (Node.js dev server)

## Usage

### Login
1. Navigate to http://localhost:5176
2. Enter credentials 
3. Access the chat interface

### Text Mode
1. Select "Text" from Input Mode dropdown
2. Type your message
3. Click Send or press Enter
4. Receive instant text feedback from the coach

### Voice Mode
1. Select "Voice" from Input Mode dropdown
2. Click "Record Voice" button
3. Speak naturally (up to 60 seconds)
4. Click "Stop" to finish recording
5. Audio is automatically transcribed
6. Coach responds with natural voice + text

### Session Features
- **Transcript**: Download full conversation as markdown
- **Key Takeaways**: Generate learning summary from chat
- **Logout**: End session and return to login

## API Endpoints

### POST /api/chat
Send a message to the AI coach.

**Request:**
```json
{
  "message": "Can you help me with pronunciation?",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "reply": "I'd be happy to help! Here are some tips for improving your pronunciation..."
}
```

### POST /api/transcribe
Convert audio to text using OpenAI Whisper.

**Request:**
- Audio file (WebM format from browser recording)

**Response:**
```json
{
  "text": "What time is the meeting",
  "success": true
}
```

### POST /api/tts
Convert text to natural speech using ElevenLabs.

**Request:**
```json
{
  "text": "Great job on your pronunciation!"
}
```

**Response:**
```json
{
  "audio": "base64_encoded_audio_data"
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT & Whisper | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice synthesis | Yes |
| `VITE_ID` | Login username | Yes |
| `VITE_PASSWORD` | Login password | Yes |

## Voice Features

### Voice Response Flow
1. **Transcription**: User's voice → OpenAI Whisper → Text
2. **Processing**: Text → GPT-4 → Coaching response
3. **Voice Synthesis**: Response text → ElevenLabs → Natural speech
4. **Playback**: Audio plays while text appears in chat
5. **Display**: Text appears after audio completes

### Voice Quality
- Uses Rachel voice from ElevenLabs (professional & natural)
- Model: `eleven_flash_v2_5` (fast & high-quality)
- Stability: 0.5 | Similarity: 0.75 (optimal balance)

## Coaching Approach

The coach is designed to be:
- **Compassionate**: Celebrates progress, normalizes mistakes
- **Constructive**: Provides specific, actionable feedback
- **Encouraging**: Focuses on growth, not perfection
- **Patient**: Understands language learning challenges

See `./api/prompt.md` for the complete system prompt.

## Development

### Available Scripts

```bash
# Start both client and API (from root)
npm run dev

# Start only client
cd client && npm run dev

# Start only API
cd api && npm run dev

# Build client
cd client && npm run build

# Preview production build
cd client && npm run preview
```

### Key Files

- `./api/prompt.md` - System prompt defining coach behavior
- `./client/.env` - Frontend environment variables
- `./api/.env` - Backend environment variables
- `./api/dev.ts` - Development server setup

## Troubleshooting

### "Invalid username or password"
- Ensure `VITE_ID` and `VITE_PASSWORD` are set in all `.env` files
- Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check browser console for debug messages

### Microphone not working
- Grant microphone permission to browser
- Ensure HTTPS in production (HTTP in local dev is fine)
- Check browser DevTools > Permissions

### Voice playback issues
- Check ElevenLabs API key is valid
- Verify API usage quota hasn't been exceeded
- Ensure browser can play audio (check speaker volume)

### API errors
- Verify OpenAI API key is valid
- Check OpenAI account has available credits
- Review API rate limits and usage

## Performance Tips

- **Voice Mode**: Best for natural conversation practice
- **Text Mode**: Better for quick grammar checks
- **Transcripts**: Download for offline review
- **Takeaways**: Use after longer sessions for learning summary

## Costs

### Service Costs (Pay-as-you-go)

| Service | Cost | Usage |
|---------|------|-------|
| **OpenAI Whisper** | $0.02/min | Voice transcription |
| **OpenAI GPT-4** | $0.03/$0.06 per 1K tokens | Coaching responses |
| **ElevenLabs** | $0.30/1K characters | Voice synthesis |

### Tips for Cost Management
- Set monthly API spending limits
- Share API keys only with trusted users
- Monitor usage regularly
- Consider batch processing for large sessions

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

WebRTC & Web Audio API required for voice recording.

## Future Enhancements

- User profiles with progress tracking
- Lesson library with structured exercises
- Pronunciation analysis with scoring
- Multiple language support
- Advanced analytics dashboard
- Mobile app

## License

MIT

## Support

For issues, feature requests, or questions:
1. Check troubleshooting section above
2. Review browser console for error messages
3. Verify all environment variables are set correctly
4. Open an issue on GitHub with error details

## Credits

Built with:
- **OpenAI**: GPT-4, Whisper API
- **ElevenLabs**: Natural voice synthesis
- **React**: UI framework
- **Vite**: Build tool
