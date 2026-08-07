export default function handler(req: any, res: any) {
  try {
    console.log('Login called')

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(200).send('')
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    const { username, password } = req.body || {}

    if (username === 'admin' && password === 'R3load@24680') {
      return res.status(200).json({ success: true })
    }

    return res.status(401).json({ error: 'Invalid credentials' })
  } catch (err) {
    console.error('Error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
