export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const validUsername = 'admin'
    const validPassword = 'R3load@24680'

    console.log('Login attempt:', { user: username, expectedUser: validUsername })

    if (username === validUsername && password === validPassword) {
      res.setHeader('Set-Cookie', 'authToken=authenticated; HttpOnly; Path=/; SameSite=Lax')
      return res.status(200).json({ success: true, message: 'Login successful' })
    } else {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      error: 'Failed to process login request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
