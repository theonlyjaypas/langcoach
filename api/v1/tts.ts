import { VercelRequest, VercelResponse } from '@vercel/node'
import { enableCors, handleOptionsRequest, validateRequest, validateNonEmpty } from '../middleware'
import { sendError, ApiError, ErrorCodes } from '../errors'
import type { TTSRequest, TTSResponse } from '../types'

const ALLOWED_VOICES = [
  '21m00Tcm4TlvDq8ikWAM' // Default English voice
]

function validateVoiceId(voice: string): void {
  if (!ALLOWED_VOICES.includes(voice)) {
    throw new ApiError(
      400,
      ErrorCodes.INVALID_INPUT,
      `Invalid voice ID. Allowed voices: ${ALLOWED_VOICES.join(', ')}`
    )
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    // Handle CORS preflight
    if (handleOptionsRequest(req, res)) {
      return
    }

    // Validate request
    validateRequest(req, res, { methods: ['POST'] })

    // Parse and validate request body
    const { text, voice = '21m00Tcm4TlvDq8ikWAM' } = req.body as TTSRequest

    validateNonEmpty(text, 'Text')
    validateVoiceId(voice)

    // Check for API key
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new ApiError(500, ErrorCodes.INTERNAL_ERROR, 'ElevenLabs API key not configured')
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
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
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new ApiError(
        response.status,
        ErrorCodes.TTS_FAILED,
        `ElevenLabs API error: ${response.status} - ${errorText}`
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)
    const base64Audio = audioBuffer.toString('base64')

    const responseData: TTSResponse = {
      audio: base64Audio,
      success: true
    }
    res.status(200).json(responseData)
  } catch (error) {
    sendError(res, error)
  }
}
