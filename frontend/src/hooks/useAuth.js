import { useAuthContext } from '../context/AuthContext'

/**
 * useAuth — convenience wrapper over AuthContext.
 * Returns { user, loading, isAuthenticated, login, logout, refreshUser }
 */
export function useAuth() {
  const { user, loading, login, logout, refreshUser } = useAuthContext()
  return {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  }
}
