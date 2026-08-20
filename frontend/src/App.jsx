import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Home        from './pages/Home'
import Lobby       from './pages/Lobby'
import Match       from './pages/Match'
import Result      from './pages/Result'
import Profile     from './pages/Profile'
import Leaderboard from './pages/Leaderboard'

/**
 * RootRoute — shows Home to guests, redirects to /lobby if already logged in.
 * Waits for AuthContext to restore the session before deciding (avoids flicker).
 */
function RootRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null                        // brief blank while localStorage is read
  return isAuthenticated ? <Navigate to="/lobby" replace /> : <Home />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        {/* pt-14 offsets the fixed navbar height */}
        <main className="pt-14 min-h-screen">
          <Routes>
            <Route path="/"              element={<RootRoute    />} />
            <Route path="/lobby"         element={<Lobby        />} />
            <Route path="/profile"           element={<Profile      />} />
            <Route path="/profile/:username" element={<Profile      />} />
            <Route path="/leaderboard"   element={<Leaderboard  />} />
            <Route path="/match/:roomId" element={<Match        />} />
            <Route path="/result"        element={<Result       />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
