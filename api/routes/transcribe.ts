import 'dotenv/config'
import { Router } from 'express'
import { OpenAI } from 'openai'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function handleTranscribe(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    // Create a temporary file for the audio
    const tempDir = '/tmp'
    const tempFileName = `audio-${Date.now()}.webm`
    const tempFilePath = path.join(tempDir, tempFileName)

    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, req.file.buffer)

    try {
      // Transcribe using OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'en'
      })

      // Clean up temp file
      fs.unlinkSync(tempFilePath)

      res.json({
        text: transcription.text,
        success: true
      })
    } catch (openaiError) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
      throw openaiError
    }
  } catch (error) {
    console.error('Transcription error:', error)
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

router.post('/transcribe', upload.single('audio'), handleTranscribe)
export default router
