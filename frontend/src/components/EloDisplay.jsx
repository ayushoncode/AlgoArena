// Stub — EloDisplay (Day 48)
export default function EloDisplay({ rating = 1200, delta = null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-arena-text">{rating}</span>
      {delta !== null && (
        <span className={`text-sm font-semibold ${delta >= 0 ? 'text-arena-green' : 'text-arena-red'}`}>
          {delta >= 0 ? '+' : ''}{delta}
        </span>
      )}
    </div>
  )
}
