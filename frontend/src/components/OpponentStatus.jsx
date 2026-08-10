// Stub — OpponentStatus indicator (Day 21)
export default function OpponentStatus({ typing = false, status = 'idle' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-arena-muted">
      <span className={`w-2 h-2 rounded-full ${typing ? 'bg-arena-green animate-pulse' : 'bg-arena-muted'}`} />
      {typing ? 'Opponent is typing…' : 'Opponent idle'}
    </div>
  )
}
