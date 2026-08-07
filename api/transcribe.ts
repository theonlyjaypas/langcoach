const OpenAI = require('openai').default || require('openai')
const fs = require('fs')
const path = require('path')
const { writeFile } = require('fs/promises')

const openai = new (OpenAI.default || OpenAI)({
  apiKey: process.env.OPENAI_API_KEY
})

module.exports = async function handler(req: any, res: any) {
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
    const { audio } = req.body

    if (!audio) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    // Convert base64 to buffer if needed, or handle as buffer
    let audioBuffer: Buffer
    if (typeof audio === 'string') {
      // Base64 string
      audioBuffer = Buffer.from(audio, 'base64')
    } else {
      audioBuffer = audio
    }

    // Create a temporary file for the audio
    const tempDir = '/tmp'
    const tempFileName = `audio-${Date.now()}.webm`
    const tempFilePath = path.join(tempDir, tempFileName)

    // Write the buffer to a temporary file
    await writeFile(tempFilePath, audioBuffer)

    try {
      // Create a readable stream from the file
      const fileStream = fs.createReadStream(tempFilePath)

      // Transcribe using OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: fileStream as any,
        model: 'whisper-1',
        language: 'en'
      })

      // Clean up temp file
      fs.unlinkSync(tempFilePath)

      res.status(200).json({
        text: transcription.text,
        success: true
      })
    } catch (openaiError) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath)
        } catch (e) {
          console.error('Failed to delete temp file:', e)
        }
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
