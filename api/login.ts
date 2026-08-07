import { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const validUsername = process.env.VITE_ID || 'admin'
    const validPassword = process.env.VITE_PASSWORD || 'password'

    console.log('Login attempt for user:', username)

    if (username === validUsername && password === validPassword) {
      res.setHeader('Set-Cookie', 'authToken=authenticated; HttpOnly; Path=/; SameSite=Lax')
      return res.status(200).json({ success: true, message: 'Login successful' })
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
