// Stub — Timer component (Day 19)
export default function Timer({ seconds = 0 }) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return (
    <div className="font-mono text-lg font-bold text-arena-text tabular-nums">
      {m}:{s}
    </div>
  )
}
