import { useAuthContext } from '../context/AuthContext'

/**
 * useAuth — convenience wrapper over AuthContext.
 * Returns { user, loading, isAuthenticated, login, logout, refreshUser, sendOtp, loginWithOtp, loginWithFirebase }
 */
export function useAuth() {
  const ctx = useAuthContext()
  return {
    ...ctx,
    isAuthenticated: !!ctx.user,
  }
}

