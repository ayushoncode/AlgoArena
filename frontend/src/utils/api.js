import axios from 'axios'

/**
 * Pre-configured Axios instance for all AlgoArena API calls.
 * Base URL is read from the VITE_API_URL env var (falls back to localhost for dev).
 * The request interceptor automatically attaches the stored JWT as a Bearer token.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor — surface errors cleanly ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || ''
    const isAuthRoute = url.includes('/auth') || url.includes('/users/me')
    if (error?.response?.status === 401 && isAuthRoute) {
      localStorage.removeItem('aa_token')
      localStorage.removeItem('aa_user')
      window.dispatchEvent(new Event('auth-logout'))
    }
    if (error?.response?.status === 403 && error?.response?.data?.code === 'PREMIUM_REQUIRED') {
      if (!error?.config?.skipGatedModal) {
        window.dispatchEvent(new CustomEvent('premium-gated-error', {
          detail: { feature: error.response.data.feature || 'sheet' }
        }))
      }
    }
    const msg = error?.response?.data?.message || error.message || 'Unknown error'
    console.error('[API Error]', msg)
    const errObj = new Error(msg)
    errObj.response = error?.response
    errObj.status = error?.response?.status
    return Promise.reject(errObj)
  }
)

export default api
