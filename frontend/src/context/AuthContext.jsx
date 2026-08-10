import { createContext, useContext, useState } from 'react'

// Stub — full auth logic (JWT storage, login/register calls) wired in Day 6
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // { id, username, elo_rating, token }

  /** Called after successful /login response */
  function login(userData) {
    setUser(userData)
    localStorage.setItem('aa_token', userData.token)
  }

  /** Clears session */
  function logout() {
    setUser(null)
    localStorage.removeItem('aa_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}

export default AuthContext
