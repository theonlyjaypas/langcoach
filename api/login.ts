export default function handler(req: any, res: any) {
  console.log('Login endpoint called:', { method: req.method, body: req.body })

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { username, password } = body

    console.log('Login attempt for user:', username)

    if (!username || !password) {
      console.log('Missing credentials')
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const validUsername = 'admin'
    const validPassword = 'R3load@24680'

    console.log('Comparing:', { received: username, expected: validUsername })

    if (username === validUsername && password === validPassword) {
      console.log('Login successful')
      res.setHeader('Set-Cookie', 'authToken=authenticated; HttpOnly; Path=/; SameSite=Lax')
      return res.status(200).json({ success: true, message: 'Login successful' })
    } else {
      console.log('Credentials mismatch')
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
