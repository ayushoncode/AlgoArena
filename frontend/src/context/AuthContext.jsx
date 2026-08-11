import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)   // { id, username, elo_rating, token }
  const [loading, setLoading] = useState(true)   // true while restoring session

  // ── Restore session from localStorage on first mount ──────────
  useEffect(() => {
    try {
      const token   = localStorage.getItem('aa_token')
      const stored  = localStorage.getItem('aa_user')
      if (token && stored) {
        const parsed = JSON.parse(stored)
        // Basic expiry check — JWT payload is base64, middle segment has exp
        const [, payload] = token.split('.')
        const { exp } = JSON.parse(atob(payload))
        if (Date.now() / 1000 < exp) {
          setUser({ ...parsed, token })
        } else {
          // Token expired — clear storage silently
          localStorage.removeItem('aa_token')
          localStorage.removeItem('aa_user')
        }
      }
    } catch {
      // Corrupted storage — wipe and start fresh
      localStorage.removeItem('aa_token')
      localStorage.removeItem('aa_user')
    } finally {
      setLoading(false)
    }
  }, [])

  /** Called after successful /login or /register response */
  function login({ token, user: userData }) {
    const full = { ...userData, token }
    setUser(full)
    localStorage.setItem('aa_token', token)
    localStorage.setItem('aa_user', JSON.stringify(userData))
  }

  /** Clears session */
  function logout() {
    setUser(null)
    localStorage.removeItem('aa_token')
    localStorage.removeItem('aa_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be inside <AuthProvider>')
  return ctx
}

export default AuthContext
