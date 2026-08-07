import 'dotenv/config'
import { Router } from 'express'
import { OpenAI } from 'openai'

const router = Router()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const SYSTEM_PROMPT = `You are an expert English speaking coach. Your role is to:
1. Help users improve their English speaking and writing skills
2. Provide constructive feedback on grammar, vocabulary, and pronunciation
3. Suggest corrections and improvements in a friendly, encouraging tone
4. Ask follow-up questions to help the user practice
5. Explain language concepts clearly when needed
6. Keep conversations natural and engaging
7. Focus on practical communication skills

Always be encouraging and supportive. When a user makes a mistake, correct it gently and explain why.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function handleChat(req, res) {
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

    res.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

router.post('/chat', handleChat)
export default router
