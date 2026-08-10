# Backend API Guide

## Quick Reference

### Centralized Middleware Pattern

All endpoints now use a consistent middleware pattern:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node'
import { enableCors, handleOptionsRequest, validateRequest } from '../middleware'
import { sendError, ApiError, ErrorCodes } from '../errors'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    // Handle CORS preflight requests
    if (handleOptionsRequest(req, res)) {
      return
    }

    // Enable CORS and validate HTTP method
    validateRequest(req, res, { methods: ['POST'] })

    // Your endpoint logic here
    res.status(200).json({ success: true })
  } catch (error) {
    // Consistent error handling
    sendError(res, error)
  }
}
```

### Error Handling

Throw `ApiError` for known errors:

```typescript
throw new ApiError(
  400,                           // HTTP status code
  ErrorCodes.INVALID_INPUT,      // Error code
  'Invalid input provided'       // Error message
)
```

The error will be automatically formatted and sent to the client:

```json
{
  "error": "Invalid input provided",
  "code": "INVALID_INPUT"
}
```

### Request Validation

```typescript
import { validateNonEmpty, validateRequiredFields } from '../middleware'

// Validate non-empty string
validateNonEmpty(message, 'Message')

// Validate required fields in object
validateRequiredFields({ audio, text }, ['audio', 'text'])
```

### Temporary File Handling

```typescript
import { withTempFile, generateTempFileName } from '../tempFile'

// Automatically handles cleanup
const result = await withTempFile(
  generateTempFileName('webm'),  // Generates unique filename
  audioBuffer,                    // File data
  async (filePath) => {          // Callback receives path
    // Process file
    return await processFile(filePath)
    // File is automatically deleted after callback completes
  }
)
```

### Type Safety

All requests and responses are typed:

```typescript
import type { ChatRequest, ChatResponse } from '../types'

const { message, conversationHistory } = req.body as ChatRequest

const response: ChatResponse = { reply: 'Hello!' }
res.status(200).json(response)
```

## Available Endpoints

### Authentication
- `POST /api/v1/login` - Authenticate user
- `POST /api/login` - (Deprecated, use v1)

### Chat
- `POST /api/v1/chat` - Send message to English coach
- `POST /api/chat` - (Deprecated, use v1)

Request:
```json
{
  "message": "How do I improve my pronunciation?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" }
  ]
}
```

### Transcription
- `POST /api/v1/transcribe` - Transcribe audio to text
- `POST /api/transcribe` - (Deprecated, use v1)

Request:
```json
{
  "audio": "base64-encoded-audio-data"
}
```

### Summarization
- `POST /api/v1/summarize` - Summarize conversation
- `POST /api/summarize` - (Deprecated, use v1)

Request:
```json
{
  "conversationHistory": [
    { "role": "user", "content": "Tell me about past tense" },
    { "role": "assistant", "content": "The past tense..." }
  ]
}
```

### Text-to-Speech
- `POST /api/v1/tts` - Generate speech from text
- `POST /api/tts` - (Deprecated, use v1)

Request:
```json
{
  "text": "Hello, how are you?",
  "voice": "21m00Tcm4TlvDq8ikWAM"
}
```

## Environment Setup

### Required Variables

Create `.env.local` with these variables:

```env
# API Keys
OPENAI_API_KEY=sk-your-key-here
ELEVENLABS_API_KEY=your-key-here

# Authentication
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password

# Frontend
VITE_API_URL=https://langcoach.vercel.app
VITE_ID=admin
VITE_PASSWORD=your-secure-password
```

### For Development

The dev server uses `VITE_ID` and `VITE_PASSWORD` environment variables. Make sure these are set in your `.env.local` file before running:

```bash
npm run dev
```

## Adding a New Endpoint

1. Create a new file in `api/v1/new-endpoint.ts`
2. Use the standard middleware pattern
3. Create request/response types in `types.ts`
4. Create a wrapper in `api/new-endpoint.ts` for backwards compatibility

```typescript
// api/v1/new-endpoint.ts
import { VercelRequest, VercelResponse } from '@vercel/node'
import { handleOptionsRequest, validateRequest } from '../middleware'
import { sendError, ApiError, ErrorCodes } from '../errors'
import type { NewEndpointRequest, NewEndpointResponse } from '../types'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (handleOptionsRequest(req, res)) return
    validateRequest(req, res, { methods: ['POST'] })

    const data = req.body as NewEndpointRequest
    // Your logic here
    
    const response: NewEndpointResponse = { /* ... */ }
    res.status(200).json(response)
  } catch (error) {
    sendError(res, error)
  }
}
```

```typescript
// api/new-endpoint.ts (backwards compatibility)
import handler from './v1/new-endpoint'
export default handler
```

## Debugging

Enable debug logs by checking the Vercel function logs:

```bash
vercel logs
```

For local development, check the console output:

```bash
npm run dev:server
```

All errors are logged to console before being sent to the client.

## Security Notes

- Always use environment variables for sensitive data (API keys, passwords)
- CORS is set to allow all origins (`*`) - consider restricting in production
- Validate all user input before passing to external APIs
- Keep API keys out of git - use `.env.local`

## Version Support

- **Node.js:** 24.x (configured in package.json)
- **TypeScript:** 5.x
- **OpenAI API:** 4.67.0+
- **ElevenLabs API:** 1.59.0+
