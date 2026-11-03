import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('arena-theme')
    if (stored) return stored
    return 'dark'
  })

  useEffect(() => {
    localStorage.setItem('arena-theme', theme)
    // Outside pages (Landing Page & Who We Are) must ALWAYS remain pure dark
    const isOutside = typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '/who-we-are')
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
