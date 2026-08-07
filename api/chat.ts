import { VercelRequest, VercelResponse } from '@vercel/node'
import { OpenAI } from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, conversationHistory = [] } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const messages: Message[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
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

    res.status(200).json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
