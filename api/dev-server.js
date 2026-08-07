import express from 'express'
import dotenv from 'dotenv'
import chatHandler from './chat.ts'
import transcribeHandler from './transcribe.ts'

dotenv.config({ path: '../.env.local' })

const app = express()
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Convert Vercel handler to Express middleware
const wrapHandler = (handler) => {
  return (req, res) => {
    handler(req, res)
  }
}

app.post('/api/chat', wrapHandler(chatHandler))
app.post('/api/transcribe', wrapHandler(transcribeHandler))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
