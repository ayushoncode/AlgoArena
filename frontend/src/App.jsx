import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home   from './pages/Home'
import Lobby  from './pages/Lobby'
import Match  from './pages/Match'
import Result from './pages/Result'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        {/* pt-14 offsets the fixed navbar height */}
        <main className="pt-14 min-h-screen">
          <Routes>
            <Route path="/"              element={<Home   />} />
            <Route path="/lobby"         element={<Lobby  />} />
            <Route path="/match/:roomId" element={<Match  />} />
            <Route path="/result"        element={<Result />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
