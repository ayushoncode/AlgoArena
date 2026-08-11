import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  function goAuth(mode) {
    // If already on home, just scroll + swap tab via URL param
    // If on another page, navigate home first then scroll
    const target = `/?auth=${mode}`
    navigate(target)
    // Small delay so the page has time to render before scrolling
    setTimeout(() => {
      document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: 'rgba(7,8,12,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1e2130',
        height: '3.5rem',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-full flex items-center justify-between">

        {/* Wordmark */}
        <a
          href="/"
          className="font-mono font-bold text-base tracking-tight transition-colors"
          style={{ color:'#dde1ea', letterSpacing:'-0.02em' }}
          onMouseOver={e => e.currentTarget.style.color = '#f97316'}
          onMouseOut={e  => e.currentTarget.style.color = '#dde1ea'}
        >
          algo<span style={{ color:'#f97316' }}>_</span>arena
        </a>

        {/* Center nav */}
        <div className="hidden sm:flex items-center gap-7">
          {[['lobby','/lobby'],['leaderboard','/leaderboard']].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono text-[11px] uppercase tracking-widest transition-colors"
              style={{ color:'#4b5563', letterSpacing:'0.13em' }}
              onMouseOver={e => e.target.style.color = '#dde1ea'}
              onMouseOut={e  => e.target.style.color = '#4b5563'}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Auth buttons — navigate to /?auth=<mode> and scroll to #auth */}
        <div className="flex items-center gap-2.5">
          <button
            id="nav-signin"
            onClick={() => goAuth('login')}
            className="btn-ghost"
            style={{ padding:'0.35rem 1rem', fontSize: 11 }}
          >
            sign in
          </button>
          <button
            id="nav-register"
            onClick={() => goAuth('register')}
            className="btn-primary"
            style={{ padding:'0.35rem 1rem', fontSize: 11 }}
          >
            register
          </button>
        </div>
      </div>
    </nav>
  )
}
