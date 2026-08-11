import { useAuthContext } from '../context/AuthContext'

/**
 * useAuth — convenience wrapper over AuthContext.
 * Returns { user, loading, isAuthenticated, login, logout }
 */
export function useAuth() {
  const { user, loading, login, logout } = useAuthContext()
  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }
}
