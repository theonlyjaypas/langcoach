import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { ApiError, ErrorCodes } from './errors'
import { requireAuth } from './auth'
import { withTempFile, generateTempFileName } from './tempFile'
import { handleSignup, handleLogin, handleLogout, handleMe } from './authHandlers'
import {
  handleListSessions,
  handleCreateSession,
  handleGetSession,
  handleRenameSession,
  handleDeleteSession,
  handlePostSessionMessage
} from './sessionsHandlers'
import type { MinimalRequest, MinimalResponse } from './types'

const __dirname = join(fileURLToPath(import.meta.url), '..')
const ALLOWED_VOICES = ['21m00Tcm4TlvDq8ikWAM']

function loadSystemPrompt(): string {
  try {
    const promptPath = join(__dirname, 'prompt.md')
    const content = readFileSync(promptPath, 'utf-8')
    return content.replace(/^# .*\n\n/, '')
  } catch (error) {
    console.warn('Failed to load prompt.md, using fallback', error)
    return `You are an expert English speaking coach. Your role is to help users improve their English speaking and writing skills by providing constructive feedback, suggestions, and explanations in a friendly and encouraging tone.`
  }
}

const SYSTEM_PROMPT = loadSystemPrompt()

async function handleChat(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  await requireAuth(req)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new ApiError(500, ErrorCodes.INTERNAL_ERROR, 'OpenAI API key not configured')
  }

  const openai = new OpenAI({ apiKey })
  const { message, conversationHistory = [] } = req.body

  if (!message || !message.trim()) {
    throw new ApiError(400, ErrorCodes.INVALID_INPUT, 'Message is required')
  }

  const messages = [
    ...conversationHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user' as const, content: message }
  ]

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    max_tokens: 500,
    temperature: 0.7
  })

  const reply = response.choices[0].message.content || 'I encountered an error processing your message.'
  res.status(200).json({ reply })
}

async function handleTranscribe(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  await requireAuth(req)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new ApiError(500, ErrorCodes.INTERNAL_ERROR, 'OpenAI API key not configured')
  }

  const openai = new OpenAI({ apiKey })
  const { audio } = req.body

  if (!audio) {
    throw new ApiError(400, ErrorCodes.MISSING_PARAM, 'Audio is required')
  }

  let audioBuffer: Buffer
  if (typeof audio === 'string') {
    audioBuffer = Buffer.from(audio, 'base64')
  } else {
    audioBuffer = audio
  }

  const text = await withTempFile(generateTempFileName('webm'), audioBuffer, async (filePath) => {
    const { createReadStream } = await import('fs')
    const fileStream = createReadStream(filePath)
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream as any,
      model: 'whisper-1',
      language: 'en'
    })
    return transcription.text
  })

  res.status(200).json({ text, success: true })
}

async function handleSummarize(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  await requireAuth(req)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new ApiError(500, ErrorCodes.INTERNAL_ERROR, 'OpenAI API key not configured')
  }

  const openai = new OpenAI({ apiKey })
  const { conversationHistory = [] } = req.body

  if (!conversationHistory || conversationHistory.length === 0) {
    throw new ApiError(400, ErrorCodes.INVALID_INPUT, 'No conversation history provided')
  }

  const messages = conversationHistory.map((msg: any) => ({
    role: msg.role as 'user' | 'assistant',
    content: String(msg.content || '')
  }))

  const conversationText = messages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
    .filter((line) => line.length > 0)
    .join('\n')

  const systemContent = `You are an expert English coach. Create a comprehensive summary of the coaching session that includes:
1. A synthesized overview of the entire conversation and its main themes
2. Key takeaways and insights discussed
3. Areas of focus or improvement identified
4. Action items or recommendations for the student

Format the summary clearly with these sections, making it practical and actionable.`

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: `Please provide a detailed summary of this coaching session:\n\n${conversationText}` }
    ],
    max_tokens: 600,
    temperature: 0.7
  })

  const summary = response.choices[0].message.content || 'Unable to generate summary.'
  res.status(200).json({ summary })
}

async function handleTTS(req: MinimalRequest, res: MinimalResponse): Promise<void> {
  await requireAuth(req)

  const { text, voice = '21m00Tcm4TlvDq8ikWAM' } = req.body

  if (!text || !text.trim()) {
    throw new ApiError(400, ErrorCodes.INVALID_INPUT, 'Text is required')
  }

  if (!ALLOWED_VOICES.includes(voice)) {
    throw new ApiError(400, ErrorCodes.INVALID_INPUT, `Invalid voice ID. Allowed voices: ${ALLOWED_VOICES.join(', ')}`)
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new ApiError(500, ErrorCodes.INTERNAL_ERROR, 'ElevenLabs API key not configured')
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiError(response.status, ErrorCodes.TTS_FAILED, `ElevenLabs API error: ${response.status} - ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const audioBuffer = Buffer.from(arrayBuffer)
  const base64Audio = audioBuffer.toString('base64')

  res.status(200).json({ audio: base64Audio, success: true })
}

interface RouteHandler {
  method: string
  pattern: RegExp
  handler: (req: MinimalRequest, res: MinimalResponse, ...params: any[]) => Promise<void>
}

const routes: RouteHandler[] = [
  { method: 'POST', pattern: /^\/api\/signup\/?$/, handler: handleSignup },
  { method: 'POST', pattern: /^\/api\/login\/?$/, handler: handleLogin },
  { method: 'POST', pattern: /^\/api\/logout\/?$/, handler: handleLogout },
  { method: 'GET', pattern: /^\/api\/me\/?$/, handler: handleMe },
  { method: 'GET', pattern: /^\/api\/sessions\/?$/, handler: handleListSessions },
  { method: 'POST', pattern: /^\/api\/sessions\/?$/, handler: handleCreateSession },
  { method: 'GET', pattern: /^\/api\/sessions\/([^/]+)\/?$/, handler: handleGetSession },
  { method: 'PATCH', pattern: /^\/api\/sessions\/([^/]+)\/?$/, handler: handleRenameSession },
  { method: 'DELETE', pattern: /^\/api\/sessions\/([^/]+)\/?$/, handler: handleDeleteSession },
  { method: 'POST', pattern: /^\/api\/sessions\/([^/]+)\/messages\/?$/, handler: handlePostSessionMessage },
  { method: 'POST', pattern: /^\/api\/chat\/?$/, handler: handleChat },
  { method: 'POST', pattern: /^\/api\/transcribe\/?$/, handler: handleTranscribe },
  { method: 'POST', pattern: /^\/api\/summarize\/?$/, handler: handleSummarize },
  { method: 'POST', pattern: /^\/api\/tts\/?$/, handler: handleTTS }
]

export async function dispatch(req: MinimalRequest, res: MinimalResponse, pathname: string): Promise<boolean> {
  const method = req.method || 'GET'

  for (const route of routes) {
    const match = pathname.match(route.pattern)
    if (match) {
      if (route.method !== method) {
        throw new ApiError(405, ErrorCodes.INVALID_METHOD, 'Method not allowed')
      }

      const params = match.slice(1).map((param: string) => {
        const parsed = parseInt(param, 10)
        return isNaN(parsed) ? param : parsed
      })

      await route.handler(req, res, ...params)
      return true
    }
  }

  return false
}
