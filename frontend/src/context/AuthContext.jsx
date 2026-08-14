import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)   // { id, username, elo_rating, token }
  const [loading, setLoading] = useState(true)   // true while restoring session

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('aa_token')
      if (!token) return
      const { data } = await api.get('/api/users/me')
      if (data) {
        setUser(prev => prev ? { ...prev, ...data } : { ...data, token })
        localStorage.setItem('aa_user', JSON.stringify(data))
      }
    } catch (e) {
      console.error('[refreshUser error]', e)
    }
  }, [])

  // ── Restore session from localStorage on first mount & fetch fresh user data ──
  useEffect(() => {
    async function initSession() {
      try {
        const token   = localStorage.getItem('aa_token')
        const stored  = localStorage.getItem('aa_user')
        if (token && stored) {
          const parsed = JSON.parse(stored)
          const [, payload] = token.split('.')
          const { exp } = JSON.parse(atob(payload))
          if (Date.now() / 1000 < exp) {
            setUser({ ...parsed, token })
            try {
              const { data } = await api.get('/api/users/me')
              if (data) {
                setUser({ ...data, token })
                localStorage.setItem('aa_user', JSON.stringify(data))
              }
            } catch (err) {
              console.warn('[Session Sync Warning]', err.message)
            }
          } else {
            localStorage.removeItem('aa_token')
            localStorage.removeItem('aa_user')
          }
        }
      } catch {
        localStorage.removeItem('aa_token')
        localStorage.removeItem('aa_user')
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [])

  /** Called after successful /login or /register response */
  const login = useCallback(({ token, user: userData }) => {
    const full = { ...userData, token }
    setUser(full)
    localStorage.setItem('aa_token', token)
    localStorage.setItem('aa_user', JSON.stringify(userData))
  }, [])

  /** Clears session */
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('aa_token')
    localStorage.removeItem('aa_user')
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
  }), [user, loading, login, logout, refreshUser])

  return (
    <AuthContext.Provider value={value}>
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
