import { useAuthContext } from '../context/AuthContext'

/**
 * useAuth — convenience wrapper around AuthContext.
 * Returns { user, login, logout, isAuthenticated }.
 * Stub: real token-restore logic will be added in Day 6.
 */
export function useAuth() {
  const { user, login, logout } = useAuthContext()
  return {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  }
}
