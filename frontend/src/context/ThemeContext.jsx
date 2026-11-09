import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function isOutsidePath(pathname = '') {
  if (!pathname) return false
  return (
    pathname === '/' ||
    pathname === '/who-we-are' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/register' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/refund-policy'
  )
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const hasAuth = typeof window !== 'undefined' && Boolean(localStorage.getItem('aa_token'))
    if (!hasAuth) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('arena-theme')
      }
      return 'dark'
    }
    const stored = localStorage.getItem('arena-theme')
    if (stored) return stored
    return 'dark'
  })

  // When user logs out, ALWAYS reset to pure dark theme
  useEffect(() => {
    const handleLogout = () => {
      setTheme('dark')
      localStorage.removeItem('arena-theme')
      document.documentElement.removeAttribute('data-theme')
    }
    window.addEventListener('auth-logout', handleLogout)
    return () => {
      window.removeEventListener('auth-logout', handleLogout)
    }
  }, [])

  useEffect(() => {
    const hasAuth = typeof window !== 'undefined' && Boolean(localStorage.getItem('aa_token'))
    if (!hasAuth) {
      document.documentElement.removeAttribute('data-theme')
      return
    }

    localStorage.setItem('arena-theme', theme)
    // Outside pages (Landing, Who We Are, Auth, Legal) must ALWAYS remain pure dark
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const isOutside = isOutsidePath(currentPath)
    if (theme === 'light' && !isOutside) {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
