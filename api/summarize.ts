import { VercelRequest, VercelResponse } from '@vercel/node'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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
    const { conversationHistory = [] } = req.body

    if (!conversationHistory || conversationHistory.length === 0) {
      return res.status(400).json({ error: 'No conversation history provided' })
    }

    const messages: Message[] = conversationHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: String(msg.content || '')
    }))

    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
      .filter(line => line.length > 0)
      .join('\n')

    console.log('Conversation text:', conversationText.substring(0, 200))
    console.log('Conversation text length:', conversationText.length)

    const systemContent = `You are an expert English coach. Create a comprehensive summary of the coaching session that includes:
1. A synthesized overview of the entire conversation and its main themes
2. Key takeaways and insights discussed
3. Areas of focus or improvement identified
4. Action items or recommendations for the student

Format the summary clearly with these sections, making it practical and actionable.`
    const userContent = `Please provide a detailed summary of this coaching session:\n\n${conversationText}`

    console.log('System content length:', systemContent.length)
    console.log('User content length:', userContent.length)

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
      ],
      max_tokens: 600,
      temperature: 0.7
    } as any)

    const summary = response.choices[0].message.content || 'Unable to generate summary.'

    res.status(200).json({ summary })
  } catch (error) {
    console.error('Summarize error:', error)
    res.status(500).json({
      error: 'Failed to summarize conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
