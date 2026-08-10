import { VercelRequest, VercelResponse } from '@vercel/node'
import { createReadStream } from 'fs'
import OpenAI from 'openai'
import { enableCors, handleOptionsRequest, validateRequest, validateRequiredFields } from '../middleware'
import { sendError, ApiError, ErrorCodes } from '../errors'
import { withTempFile, generateTempFileName } from '../tempFile'
import type { TranscribeRequest, TranscribeResponse } from '../types'

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
    const { audio } = req.body as TranscribeRequest

    validateRequiredFields({ audio }, ['audio'])

    // Convert base64 to buffer if needed
    let audioBuffer: Buffer
    if (typeof audio === 'string') {
      audioBuffer = Buffer.from(audio, 'base64')
    } else {
      audioBuffer = audio
    }

    // Use temp file handler to manage cleanup automatically
    const result = await withTempFile(
      generateTempFileName('webm'),
      audioBuffer,
      async (filePath) => {
        const fileStream = createReadStream(filePath)

        const transcription = await openai.audio.transcriptions.create({
          file: fileStream as any,
          model: 'whisper-1',
          language: 'en'
        })

        return transcription.text
      }
    )

    const responseData: TranscribeResponse = {
      text: result,
      success: true
    }
    res.status(200).json(responseData)
  } catch (error) {
    sendError(res, error)
  }
}
