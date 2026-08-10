import { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import { enableCors, handleOptionsRequest, validateRequest, validateNonEmpty } from '../middleware'
import { sendError, ApiError, ErrorCodes } from '../errors'
import type { ChatRequest, ChatResponse, Message } from '../types'

const __dirname = join(fileURLToPath(import.meta.url), '..')

function loadSystemPrompt(): string {
  try {
    const promptPath = join(__dirname, '..', 'prompt.md')
    const content = readFileSync(promptPath, 'utf-8')
    return content.replace(/^# .*\n\n/, '')
  } catch (error) {
    console.warn('Failed to load prompt.md, using fallback', error)
    return `You are an expert English speaking coach. Your role is to help users improve their English speaking and writing skills by providing constructive feedback, suggestions, and explanations in a friendly and encouraging tone.`
  }
}

const SYSTEM_PROMPT = loadSystemPrompt()

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    // Handle CORS preflight
    if (handleOptionsRequest(req, res)) {
      return
    }

    // Validate request
    validateRequest(req, res, { methods: ['POST'] })

    // Initialize OpenAI client
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new ApiError(500, ErrorCodes.INTERNAL_ERROR, 'OpenAI API key not configured')
    }

    const openai = new OpenAI({ apiKey })

    // Parse and validate request body
    const { message, conversationHistory = [] } = req.body as ChatRequest

    validateNonEmpty(message, 'Message')

    const messages: Message[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Call OpenAI API
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

    const responseData: ChatResponse = { reply }
    res.status(200).json(responseData)
  } catch (error) {
    sendError(res, error)
  }
}
