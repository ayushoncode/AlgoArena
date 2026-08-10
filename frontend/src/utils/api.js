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
    const msg = error?.response?.data?.message || error.message || 'Unknown error'
    console.error('[API Error]', msg)
    return Promise.reject(new Error(msg))
  }
)

export default api
