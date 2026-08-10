// Placeholder page — Home (Day 3 will build the real UI)
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in">
      <div className="card max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-arena-accent/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-arena-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-arena-text">AlgoArena</h1>
        <p className="text-arena-muted text-sm">Home page — Login &amp; Register forms coming in Day 3</p>
        <div className="flex gap-3 justify-center">
          <a href="/lobby" className="btn-primary text-sm">Go to Lobby →</a>
        </div>
      </div>
    </div>
  )
}
