import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import OnboardingModal from './components/OnboardingModal'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Match from './pages/Match'
import Result from './pages/Result'
// Phase C/D v2 components — imported lazily so the flag is tree-shaken when unused
// import MatchV2 from './pages/MatchV2'   // placeholder — added in Phase C
// import ResultV2 from './pages/ResultV2' // placeholder — added in Phase B
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import WhoWeAre from './pages/WhoWeAre'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import RefundPolicy from './pages/RefundPolicy'
import BillingPage from './pages/Account/BillingPage'
import DailyChallengePage from './pages/DailyChallengePage'
import AuthPage from './pages/AuthPage'
import IntelReports from './pages/IntelReports'
import IntelReportDetail from './pages/IntelReportDetail'
import ShareExperienceWizard from './pages/ShareExperienceWizard'
import { useSocket } from './hooks/useSocket'
import { getActiveMatch, setActiveMatch } from './utils/activeMatch'
import { ThemeProvider } from './context/ThemeContext'
import { PremiumProvider } from './context/PremiumContext'
import MascotProvider from './components/mascot/MascotProvider.jsx'
import PremiumPage from './pages/Premium/PremiumPage'

import { Shield, ChevronRight } from 'lucide-react'
import { PageWrapper, HudPanel } from './components/ui/index.jsx'

// Dev-only preview route -- lazy, tree-shaken in production builds
const DevMascot = import.meta.env.DEV
  ? React.lazy(() => import('./pages/DevMascot.jsx'))
  : null

/**
 * ScrollToTop — Scrolls window to top whenever pathname changes.
 * Skips auto scroll-top if navigating to home with ?auth= query param.
 */
function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (pathname === '/' && search.includes('auth=')) return
    window.scrollTo(0, 0)
  }, [pathname, search])

  return null
}

/**
 * PageTitleSync — Synchronizes browser document.title with the active section/route.
 * Ensures the browser tab title always accurately reflects the current page.
 */
function PageTitleSync() {
  const { pathname } = useLocation()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (pathname === '/') {
      document.title = isAuthenticated
        ? 'Lobby | AlgoArena'
        : 'AlgoArena | Real-Time 1v1 Coding Duels'
    } else if (pathname === '/lobby') {
      document.title = 'Lobby | AlgoArena'
    } else if (pathname === '/leaderboard') {
      document.title = 'Leaderboard | AlgoArena'
    } else if (pathname === '/daily') {
      document.title = 'Daily Problem | AlgoArena'
    } else if (pathname === '/experiences') {
      document.title = 'Intel Reports | AlgoArena'
    } else if (pathname === '/experiences/mine') {
      document.title = 'My Reports | AlgoArena'
    } else if (pathname === '/experiences/saved') {
      document.title = 'Saved Reports | AlgoArena'
    } else if (pathname === '/experiences/new') {
      document.title = 'Share Experience | AlgoArena'
    } else if (pathname.startsWith('/experiences/') && pathname.endsWith('/edit')) {
      document.title = 'Edit Experience | AlgoArena'
    } else if (pathname.startsWith('/experiences/')) {
      document.title = 'Interview Report | AlgoArena'
    } else if (pathname === '/profile') {
      document.title = user?.username ? `${user.username} | AlgoArena` : 'Profile | AlgoArena'
    } else if (pathname.startsWith('/profile/')) {
      const username = pathname.replace('/profile/', '').split('/')[0]
      document.title = username ? `${username} | AlgoArena` : 'Profile | AlgoArena'
    } else if (pathname === '/who-we-are') {
      document.title = 'Who We Are | AlgoArena'
    } else if (pathname === '/premium') {
      document.title = 'Premium | AlgoArena'
    } else if (pathname === '/account/billing') {
      document.title = 'Billing & Subscription | AlgoArena'
    } else if (pathname === '/terms') {
      document.title = 'Terms of Service | AlgoArena'
    } else if (pathname === '/privacy') {
      document.title = 'Privacy Policy | AlgoArena'
    } else if (pathname === '/refund-policy') {
      document.title = 'Refund and Cancellation Policy | AlgoArena'
    } else if (pathname === '/login') {
      document.title = 'Sign In | AlgoArena'
    } else if (pathname === '/signup' || pathname === '/register') {
      document.title = 'Join the Roster | AlgoArena'
    } else if (pathname.startsWith('/match/')) {
      document.title = 'Match Arena | AlgoArena'
    } else if (pathname === '/result') {
      document.title = 'Match Result | AlgoArena'
    }
  }, [pathname, isAuthenticated, user?.username])

  return null
}

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
  const location = useLocation()
  const isLegacy = location.search.includes('ui=legacy') || import.meta.env.VITE_INTEL_UI === 'legacy'

  if (loading) return null

  if (!isAuthenticated) {
    if (isLegacy) {
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

    return (
      <div className="intel-v2">
        <div className="intel-v2-container">
          <div className="intel-auth-gate-box">
            <span className="intel-overline">Intel reports</span>
            <h1 className="intel-auth-gate-h1">Sign in to read interview reports.</h1>
            <p className="intel-auth-gate-copy">
              Real interview experiences from other players. Read before your next interview, write one after.
            </p>
            <button
              type="button"
              onClick={() => navigate('/?auth=login')}
              className="intel-btn-primary"
              style={{ marginTop: '8px' }}
            >
              Sign in to Arena
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}

/**
 * ActiveMatchGuard — if the user accidentally closed their match tab and
 * reopens the site, send them straight back into the running match.
 *  1. Instant: localStorage record written by Match.jsx
 *  2. Fallback: ask the server (check_active_match → active_match)
 */
function ActiveMatchGuard() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading } = useAuth()
  const { connected, emit, on, off } = useSocket()
  const onMatchPage = pathname.startsWith('/match') || pathname.startsWith('/result')

  // 1. localStorage (works even before socket connects)
  useEffect(() => {
    if (loading || !isAuthenticated || onMatchPage) return
    const active = getActiveMatch()
    if (active && (!active.userId || !user?.id || String(active.userId) === String(user.id))) {
      navigate(`/match/${active.roomId}`, { replace: true })
    }
  }, [loading, isAuthenticated, onMatchPage, user?.id, navigate])

  // 2. Server-side check
  useEffect(() => {
    if (!isAuthenticated || onMatchPage) return
    function onActiveMatch(data) {
      if (!data?.roomId) return
      setActiveMatch(data.roomId, user?.id)
      navigate(`/match/${data.roomId}`, {
        replace: true,
        state: { roomId: data.roomId, topic: data.topic, difficulty: data.difficulty, players: data.players, problemId: data.problemId, isCustom: data.isCustom, startedAt: data.startedAt },
      })
    }
    on('active_match', onActiveMatch)
    if (connected) emit('check_active_match')
    return () => off('active_match', onActiveMatch)
  }, [isAuthenticated, onMatchPage, connected, emit, on, off, navigate, user?.id])

  return null
}

/**
 * UI flag helpers — ?ui=legacy renders the original (legacy) battle room / result screens.
 * When Phase C/D presentational v2 components exist, swap the import above and these
 * wrappers will automatically serve v2 by default.
 *
 * Usage: /match/abc123?ui=legacy  or  /result?ui=legacy
 */
function MatchRoute() {
  // Legacy flag: ?ui=legacy keeps the original component.
  // Phase C: replace `null` with `<MatchV2 />` below.
  const [params] = useSearchParams()
  const isLegacy = params.get('ui') === 'legacy'
  // When MatchV2 exists: return isLegacy ? <Match /> : <MatchV2 />
  return <Match />
}

function ResultRoute() {
  // Legacy flag: ?ui=legacy keeps the original component.
  // Phase B: replace `null` with `<ResultV2 />` below.
  const [params] = useSearchParams()
  const isLegacy = params.get('ui') === 'legacy'
  // When ResultV2 exists: return isLegacy ? <Result /> : <ResultV2 />
  return <Result />
}

function AppLayout() {
  const { pathname } = useLocation()
  const { isAuthenticated } = useAuth()
  const isMatchPage = pathname.startsWith('/match')
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/register'
  const isLandingPage = pathname === '/' && !isAuthenticated
  const isEditorialPage = isLandingPage || pathname === '/who-we-are' || (pathname === '/leaderboard' && !isAuthenticated) || isAuthPage

  return (
    <>
      <ScrollToTop />
      <PageTitleSync />
      <ActiveMatchGuard />
      <OnboardingModal />
      {/* Mascot guide -- one mount line, lazy-loaded after first paint */}
      <MascotProvider />
      {!isMatchPage && !isEditorialPage && <Navbar />}
      {/* Remove pt-14 padding and use h-screen on match pages only */}
      <main className={isMatchPage ? "h-screen w-screen overflow-hidden" : isEditorialPage ? "min-h-screen w-full relative" : "pt-14 min-h-screen"}>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/signup" element={<AuthPage initialMode="register" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/daily" element={<DailyChallengePage />} />
          <Route path="/who-we-are" element={<WhoWeAre />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/account/billing" element={<BillingPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          {/* Intel Reports Routes (Gated) */}
          <Route path="/experiences" element={<RequireAuthGate><IntelReports /></RequireAuthGate>} />
          <Route path="/experiences/mine" element={<RequireAuthGate><IntelReports /></RequireAuthGate>} />
          <Route path="/experiences/saved" element={<RequireAuthGate><IntelReports /></RequireAuthGate>} />
          <Route path="/experiences/new" element={<RequireAuthGate><ShareExperienceWizard /></RequireAuthGate>} />
          <Route path="/experiences/:id" element={<RequireAuthGate><IntelReportDetail /></RequireAuthGate>} />
          <Route path="/experiences/:id/edit" element={<RequireAuthGate><ShareExperienceWizard /></RequireAuthGate>} />

          <Route path="/match/:roomId" element={<MatchRoute />} />
          <Route path="/result" element={<ResultRoute />} />
          {/* Dev-only preview routes (not built in production) */}
          {DevMascot && <Route path="/dev/mascot" element={<React.Suspense fallback={null}><DevMascot /></React.Suspense>} />}
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <PremiumProvider>
            <AppLayout />
          </PremiumProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
