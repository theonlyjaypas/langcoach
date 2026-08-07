import 'dotenv/config'
import { createServer } from 'http'
import { OpenAI } from 'openai'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'

const PORT = 3001

interface ParsedRequest {
  method: string
  url: string
  headers: Record<string, string>
  body: string
}

interface VercelRequest {
  method?: string
  url?: string
  headers: Record<string, string>
  body?: any
}

interface VercelResponse {
  statusCode?: number
  status?: (code: number) => VercelResponse
  json?: (data: any) => void
  setHeader: (key: string, value: string) => void
  end?: (data?: string) => void
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

function loadSystemPrompt(): string {
  try {
    const promptPath = path.join(__dirname, 'prompt.md')
    const content = fs.readFileSync(promptPath, 'utf-8')
    return content.replace(/^# .*\n\n/, '')
  } catch (error) {
    console.warn('Failed to load prompt.md, using fallback', error)
    return `You are a compassionate and supportive English speaking coach. Help users improve their English speaking and writing skills with patience and understanding.`
  }
}

const SYSTEM_PROMPT = loadSystemPrompt()

async function handleChat(req: VercelRequest, res: VercelResponse) {
  const setCorsHeaders = (res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status?.(200).end?.()
    return
  }

  try {
    const { message, conversationHistory = [] } = req.body || {}

    if (!message || !message.trim()) {
      res.status?.(400)
      res.json?.({ error: 'Message is required' })
      return
    }

    const messages: any[] = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    const reply = response.choices[0].message.content || 'I encountered an error processing your message.'

    res.status?.(200)
    res.json?.({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    res.status?.(500)
    res.json?.({
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleTranscribe(req: VercelRequest, res: VercelResponse) {
  const setCorsHeaders = (res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status?.(200).end?.()
    return
  }

  try {
    const { audio } = req.body || {}

    if (!audio) {
      res.status?.(400)
      res.json?.({ error: 'No audio data provided' })
      return
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64')

    // Create temporary file
    const tempDir = '/tmp'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempFileName = `audio-${Date.now()}.webm`
    const tempFilePath = path.join(tempDir, tempFileName)

    fs.writeFileSync(tempFilePath, audioBuffer)

    try {
      const fileStream = fs.createReadStream(tempFilePath)

      const transcription = await openai.audio.transcriptions.create({
        file: fileStream as any,
        model: 'whisper-1',
        language: 'en'
      })

      fs.unlinkSync(tempFilePath)

      res.status?.(200)
      res.json?.({
        text: transcription.text,
        success: true
      })
    } catch (openaiError) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
      throw openaiError
    }
  } catch (error) {
    console.error('Transcription error:', error)
    res.status?.(500)
    res.json?.({
      error: 'Failed to transcribe audio',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleSummarize(req: VercelRequest, res: VercelResponse) {
  const setCorsHeaders = (res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status?.(200).end?.()
    return
  }

  try {
    const { conversationHistory = [] } = req.body || {}

    if (!conversationHistory || conversationHistory.length === 0) {
      res.status?.(400)
      res.json?.({ error: 'No conversation history provided' })
      return
    }

    const messages: any[] = conversationHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: String(msg.content || '')
    }))

    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
      .filter(line => line.length > 0)
      .join('\n')

    console.log('Conversation text:', conversationText.substring(0, 200))
    console.log('Conversation text length:', conversationText.length)

    const systemContent = 'You are an expert English coach. Summarize the coaching session concisely.'
    const userContent = `Please summarize:\n${conversationText}`

    console.log('System content length:', systemContent.length)
    console.log('User content length:', userContent.length)

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
      ],
      max_tokens: 300,
      temperature: 0.7
    } as any)

    const summary = response.choices[0].message.content || 'Unable to generate summary.'

    res.status?.(200)
    res.json?.({ summary })
  } catch (error) {
    console.error('Summarize error:', error)
    res.status?.(500)
    res.json?.({
      error: 'Failed to summarize conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleTts(req: VercelRequest, res: VercelResponse) {
  const setCorsHeaders = (res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status?.(200).end?.()
    return
  }

  try {
    const { text } = req.body || {}

    if (!text || !text.trim()) {
      res.status?.(400)
      res.json?.({ error: 'Text is required' })
      return
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      res.status?.(500)
      res.json?.({ error: 'ElevenLabs API key not configured' })
      return
    }

    const response = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
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
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)
    const base64Audio = audioBuffer.toString('base64')

    res.status?.(200)
    res.json?.({ audio: base64Audio })
  } catch (error) {
    console.error('TTS error:', error)
    res.status?.(500)
    res.json?.({
      error: 'Failed to generate speech',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const setCorsHeaders = (res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status?.(200).end?.()
    return
  }

  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      res.status?.(400)
      res.json?.({ error: 'Username and password are required' })
      return
    }

    const validUsername = process.env.VITE_ID || 'admin'
    const validPassword = process.env.VITE_PASSWORD || 'password'

    console.log('Login attempt for user:', username)

    if (username === validUsername && password === validPassword) {
      res.setHeader('Set-Cookie', 'authToken=authenticated; HttpOnly; Path=/; SameSite=Lax')
      res.status?.(200)
      res.json?.({ success: true, message: 'Login successful' })
      return
    } else {
      res.status?.(401)
      res.json?.({ error: 'Invalid username or password' })
      return
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status?.(500)
    res.json?.({
      error: 'Failed to process login request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

const server = createServer(async (req, res) => {
  let body = ''

  req.on('data', (chunk) => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    const parsedUrl = new url.URL(req.url || '', `http://${req.headers.host}`)
    const pathname = parsedUrl.pathname

    console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`)

    const mockReq: VercelRequest = {
      method: req.method,
      url: req.url,
      headers: req.headers as Record<string, string>,
      body: body ? JSON.parse(body) : {}
    }

    const mockRes: VercelResponse = {
      statusCode: 200,
      headers: {},
      setHeader: (key: string, value: string) => {
        res.setHeader(key, value)
      },
      status: (code: number) => {
        res.statusCode = code
        return mockRes
      },
      json: (data: any) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      },
      end: (data?: string) => {
        res.end(data)
      }
    }

    if (pathname === '/api/login') {
      console.log('Handling login request')
      await handleLogin(mockReq, mockRes)
    } else if (pathname === '/api/chat') {
      await handleChat(mockReq, mockRes)
    } else if (pathname === '/api/transcribe') {
      await handleTranscribe(mockReq, mockRes)
    } else if (pathname === '/api/summarize') {
      await handleSummarize(mockReq, mockRes)
    } else if (pathname === '/api/tts') {
      await handleTts(mockReq, mockRes)
    } else {
      res.statusCode = 404
      res.end('Not found')
    }
  })
})

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log('Endpoints:')
  console.log('  POST http://localhost:${PORT}/api/login')
  console.log('  POST http://localhost:${PORT}/api/chat')
  console.log('  POST http://localhost:${PORT}/api/transcribe')
  console.log('  POST http://localhost:${PORT}/api/summarize')
  console.log('  POST http://localhost:${PORT}/api/tts')
})
