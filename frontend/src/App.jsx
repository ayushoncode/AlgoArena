import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import UsernameOnboardingModal from './components/UsernameOnboardingModal'
import InstituteOnboardingModal from './components/InstituteOnboardingModal'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Match from './pages/Match'
import Result from './pages/Result'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import WhoWeAre from './pages/WhoWeAre'
import IntelReports from './pages/IntelReports'
import IntelReportDetail from './pages/IntelReportDetail'
import ShareExperienceWizard from './pages/ShareExperienceWizard'

import { Shield, ChevronRight } from 'lucide-react'
import { PageWrapper, HudPanel } from './components/ui/index.jsx'

/**
 * RootRoute — shows Home to guests, redirects to /lobby if already logged in.
 * Waits for AuthContext to restore the session before deciding (avoids flicker).
 */
function RootRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null                        // brief blank while localStorage is read
  return isAuthenticated ? <Navigate to="/lobby" replace /> : <Home />
}

/**
 * RequireAuthGate — Restricted Intel Reports access gate for logged out users
 */
function RequireAuthGate({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return null

  if (!isAuthenticated) {
    return (
      <PageWrapper heroGlow style={{ paddingBottom: '5rem' }}>
        <div className="pt-20 pb-16 px-5 sm:px-8 text-center max-w-xl mx-auto">
          <HudPanel className="p-8 sm:p-10 space-y-5 border-rose-500/40">
            <div className="w-14 h-14 mx-auto flex items-center justify-center bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
              <Shield size={28} />
            </div>
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-widest text-rose-400">// RESTRICTED INTEL</p>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase">
                SIGN IN TO ACCESS INTEL REPORTS
              </h1>
              <p className="font-sans text-sm text-slate-300 leading-relaxed">
                Interview experiences, company round breakdowns, and question logs are restricted to authenticated arena members.
              </p>
            </div>
            <button
              onClick={() => navigate('/?auth=login')}
              className="inline-flex items-center gap-2 px-6 py-3 font-display font-bold text-sm uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 transition-colors"
              style={{ clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)' }}
            >
              Sign In To Arena <ChevronRight size={16} />
            </button>
          </HudPanel>
        </div>
      </PageWrapper>
    )
  }

  return children
}

function AppLayout() {
  const { pathname } = useLocation()
  const isMatchPage = pathname.startsWith('/match')

  return (
    <>
      <UsernameOnboardingModal />
      <InstituteOnboardingModal />
      {!isMatchPage && <Navbar />}
      {/* Remove pt-14 padding and use h-screen on match pages to maximize IDE height */}
      <main className={isMatchPage ? "h-screen w-screen overflow-hidden" : "pt-14 min-h-screen"}>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/who-we-are" element={<WhoWeAre />} />
          {/* Intel Reports Routes (Gated) */}
          <Route path="/experiences" element={<RequireAuthGate><IntelReports /></RequireAuthGate>} />
          <Route path="/experiences/mine" element={<RequireAuthGate><IntelReports /></RequireAuthGate>} />
          <Route path="/experiences/saved" element={<RequireAuthGate><IntelReports /></RequireAuthGate>} />
          <Route path="/experiences/new" element={<RequireAuthGate><ShareExperienceWizard /></RequireAuthGate>} />
          <Route path="/experiences/:id" element={<RequireAuthGate><IntelReportDetail /></RequireAuthGate>} />
          <Route path="/experiences/:id/edit" element={<RequireAuthGate><ShareExperienceWizard /></RequireAuthGate>} />
          
          <Route path="/match/:roomId" element={<Match />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}
