import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import api from '../utils/api'
import { clearStreakCache } from '../components/navbar/navData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)   // { id, username, elo_rating, token }
  const [loading, setLoading] = useState(true)   // true while restoring session

  const refreshUser = useCallback(async (explicitData) => {
    try {
      const token = localStorage.getItem('aa_token')
      if (!token) return null
      let updated = explicitData
      if (!updated) {
        const { data } = await api.get('/api/users/me')
        updated = data
      }
      if (updated) {
        setUser(prev => ({ ...(prev || {}), ...updated, token }))
        localStorage.setItem('aa_user', JSON.stringify(updated))
        return updated
      }
    } catch (e) {
      console.error('[refreshUser error]', e)
    }
    return null
  }, [])

  // ── Restore session from localStorage on first mount & fetch fresh user data ──
  useEffect(() => {
    async function initSession() {
      try {
        const token   = localStorage.getItem('aa_token')
        const stored  = localStorage.getItem('aa_user')
        if (token && stored) {
          const parsed = JSON.parse(stored)
          // Optimistically set user
          setUser({ ...parsed, token })
          
          try {
            const { data } = await api.get('/api/users/me')
            if (data) {
              setUser({ ...data, token })
              localStorage.setItem('aa_user', JSON.stringify(data))
            }
          } catch (err) {
            console.warn('[Session Sync Warning]', err.message)
            // If api throws 401, api.js interceptor will dispatch 'auth-logout' and clear tokens.
          }
        }
      } catch (err) {
        console.error('[Session Restore Error]', err)
        localStorage.removeItem('aa_token')
        localStorage.removeItem('aa_user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [])

  // ── Sync Auth State across multiple tabs in the same browser ──
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === 'aa_user' || e.key === 'aa_token' || e.type === 'auth-logout') {
        const token = localStorage.getItem('aa_token')
        const stored = localStorage.getItem('aa_user')
        if (token && stored) {
          try {
            setUser({ ...JSON.parse(stored), token })
          } catch {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-logout', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-logout', handleStorageChange)
    }
  }, [])

  /** Called after successful /login or /register response */
  const login = useCallback(async ({ token, user: userData }) => {
    clearStreakCache()
    const full = { ...userData, token }
    setUser(full)
    localStorage.setItem('aa_user', JSON.stringify(userData))
    localStorage.setItem('aa_token', token)

    // Immediately fetch full fresh user profile (including rank) to guarantee zero stale data
    try {
      const { data } = await api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data) {
        const enriched = { ...data, token }
        setUser(enriched)
        localStorage.setItem('aa_user', JSON.stringify(data))
      }
    } catch {
      // Non-fatal if offline or backend unavailable
    }
  }, [])

  /** Send OTP to email */
  const sendOtp = useCallback(async (email) => {
    const { data } = await api.post('/api/auth/send-otp', { email })
    return data
  }, [])

  /** Verify OTP and login */
  const loginWithOtp = useCallback(async ({ email, otp, username }) => {
    const { data } = await api.post('/api/auth/verify-otp', { email, otp, username })
    if (data.token && data.user) {
      login(data)
    }
    return data
  }, [login])

  /** Login via Firebase ID Token */
  const loginWithFirebase = useCallback(async ({ idToken, username }) => {
    const { data } = await api.post('/api/auth/firebase', { idToken, username })
    if (data.token && data.user) {
      login(data)
    }
    return data
  }, [login])

  /** Clears session */
  const logout = useCallback(() => {
    clearStreakCache()
    setUser(null)
    localStorage.removeItem('aa_token')
    localStorage.removeItem('aa_user')
    localStorage.removeItem('arena-theme')
    document.documentElement.removeAttribute('data-theme')
    window.dispatchEvent(new Event('auth-logout'))
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
    sendOtp,
    loginWithOtp,
    loginWithFirebase,
  }), [user, loading, login, logout, refreshUser, sendOtp, loginWithOtp, loginWithFirebase])

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
