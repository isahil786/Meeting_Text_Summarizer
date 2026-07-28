import { useState } from 'react'
import { loginUser, registerUser } from '../api'

export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      if (isLogin) {
        const data = await loginUser(email, password)
        onAuthenticated(data.access_token, email)
      } else {
        await registerUser(username, email, password)
        setNotice('Account created. You can sign in now.')
        setMode('login')
        setPassword('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card auth-card">
      <div className="card-tab" aria-hidden="true">
        {isLogin ? 'Sign in' : 'New notebook'}
      </div>

      <h1 className="card-title">
        {isLogin ? 'Welcome back' : 'Start your notebook'}
      </h1>
      <p className="card-subtitle">
        {isLogin
          ? 'Sign in to summarize your lectures and meetings.'
          : 'Register to save and email your summaries.'}
      </p>

      <form onSubmit={handleSubmit} className="stack">
        {!isLogin && (
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jane.doe"
              required
            />
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {error && <p className="message message-error">{error}</p>}
        {notice && <p className="message message-ok">{notice}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Working…' : isLogin ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        className="link-toggle"
        onClick={() => {
          setMode(isLogin ? 'register' : 'login')
          setError('')
          setNotice('')
        }}
      >
        {isLogin ? "Don't have an account? Register" : 'Already registered? Sign in'}
      </button>
    </div>
  )
}
