import { useParams } from 'react-router-dom'

// Placeholder page — Match (Week 4 will add Monaco editor + live battle UI)
export default function Match() {
  const { roomId } = useParams()

  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in">
      <div className="card max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-arena-green/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-arena-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-arena-text">Match Room</h1>
        <div className="badge bg-arena-accent/20 text-arena-accent mx-auto">
          Room: {roomId}
        </div>
        <p className="text-arena-muted text-sm">Monaco editor + live battle UI coming in Week 4</p>
        <div className="flex gap-3 justify-center">
          <a href="/lobby" className="btn-ghost text-sm">← Lobby</a>
          <a href="/result" className="btn-primary text-sm">Result →</a>
        </div>
      </div>
    </div>
  )
}
