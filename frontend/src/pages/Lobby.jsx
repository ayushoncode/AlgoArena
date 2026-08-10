// Placeholder page — Lobby (Week 2 will build topic selector + matchmaking)
export default function Lobby() {
  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in">
      <div className="card max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-arena-accent/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-arena-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-arena-text">Lobby</h1>
        <p className="text-arena-muted text-sm">Topic selector &amp; matchmaking coming in Week 2</p>
        <div className="flex gap-3 justify-center">
          <a href="/" className="btn-ghost text-sm">← Home</a>
        </div>
      </div>
    </div>
  )
}
