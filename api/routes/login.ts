import 'dotenv/config'
import { Router } from 'express'

const router = Router()

export async function handleLogin(req, res) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const validUsername = process.env.VITE_ID || 'admin'
    const validPassword = process.env.VITE_PASSWORD || 'password'

    if (username === validUsername && password === validPassword) {
      res.setHeader('Set-Cookie', 'authToken=authenticated; HttpOnly; Path=/; SameSite=Lax')
      return res.json({ success: true, message: 'Login successful' })
    } else {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Failed to process login request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

router.post('/login', handleLogin)
export default router
