import { useEffect, useState } from 'react'
import AuthForm from './components/AuthForm'
import SummarizerPanel from './components/SummarizerPanel'

const STORAGE_KEY = 'marginal.auth'

export default function App() {
  const [auth, setAuth] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setAuth(JSON.parse(saved))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  function handleAuthenticated(token, email) {
    const next = { token, email }
    setAuth(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function handleSignOut() {
    setAuth(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <div className="page">
      <div className="paper-lines" aria-hidden="true" />
      <div className="page-content">
        {auth ? (
          <SummarizerPanel token={auth.token} email={auth.email} onSignOut={handleSignOut} />
        ) : (
          <div className="auth-screen">
            <AuthForm onAuthenticated={handleAuthenticated} />
          </div>
        )}
      </div>
    </div>
  )
}
