// Stub — will be implemented in Day 3
export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-arena-bg/80 backdrop-blur-md border-b border-arena-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="/" className="text-lg font-bold text-arena-text hover:text-arena-accent transition-colors">
          <span className="text-arena-accent">Algo</span>Arena
        </a>
        <div className="flex items-center gap-3">
          <a href="/lobby" className="btn-ghost text-sm py-1.5 px-4">Lobby</a>
          <a href="/" className="btn-primary text-sm py-1.5 px-4">Login</a>
        </div>
      </div>
    </nav>
  )
}
