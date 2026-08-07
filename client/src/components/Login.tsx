import { useState, useEffect } from 'react'
import '../styles/Login.css'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log('=== LOGIN COMPONENT MOUNTED ===')
    console.log('All import.meta.env keys:', Object.keys(import.meta.env))
    console.log('VITE_ID:', import.meta.env.VITE_ID)
    console.log('VITE_PASSWORD:', import.meta.env.VITE_PASSWORD)
    console.log('================================')
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const validId = import.meta.env.VITE_ID || 'admin'
    const validPassword = import.meta.env.VITE_PASSWORD || 'password'

    console.log('=== LOGIN DEBUG ===')
    console.log('Environment Variables:')
    console.log('  VITE_ID:', validId)
    console.log('  VITE_PASSWORD:', validPassword)
    console.log('User Input:')
    console.log('  username:', username)
    console.log('  password:', password)
    console.log('Match check:')
    console.log('  username match:', username === validId)
    console.log('  password match:', password === validPassword)
    console.log('=== END DEBUG ===')

    setTimeout(() => {
      if (username === validId && password === validPassword) {
        localStorage.setItem('authToken', 'authenticated')
        onLogin()
      } else {
        setError('Invalid username or password')
        setPassword('')
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>LangCoach</h1>
        <p className="login-subtitle">Improve your English with AI-powered coaching</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder="Enter username"
              disabled={isLoading}
              autoFocus
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter password"
                disabled={isLoading}
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.26 3.64m-5.88-2.88a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="login-button"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
