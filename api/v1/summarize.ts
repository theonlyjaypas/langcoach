import { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { enableCors, handleOptionsRequest, validateRequest, validateRequiredFields } from '../middleware'
import { sendError, ApiError, ErrorCodes } from '../errors'
import type { SummarizeRequest, SummarizeResponse, Message } from '../types'

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
    const { conversationHistory = [] } = req.body as SummarizeRequest

    if (!conversationHistory || conversationHistory.length === 0) {
      throw new ApiError(
        400,
        ErrorCodes.INVALID_INPUT,
        'No conversation history provided'
      )
    }

    const messages: Message[] = conversationHistory.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: String(msg.content || '')
    }))

    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`)
      .filter(line => line.length > 0)
      .join('\n')

    const systemContent = `You are an expert English coach. Create a comprehensive summary of the coaching session that includes:
1. A synthesized overview of the entire conversation and its main themes
2. Key takeaways and insights discussed
3. Areas of focus or improvement identified
4. Action items or recommendations for the student

Format the summary clearly with these sections, making it practical and actionable.`

    const userContent = `Please provide a detailed summary of this coaching session:\n\n${conversationText}`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
      ],
      max_tokens: 600,
      temperature: 0.7
    })

    const summary = response.choices[0].message.content || 'Unable to generate summary.'

    const responseData: SummarizeResponse = { summary }
    res.status(200).json(responseData)
  } catch (error) {
    sendError(res, error)
  }
}
