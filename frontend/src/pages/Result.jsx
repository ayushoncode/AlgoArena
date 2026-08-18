import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

/* ════════════════════════════════════════════════
   CONFETTI — pure CSS particles on WIN
════════════════════════════════════════════════ */
function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => i)
  const colors = ['#f97316','#22d3ee','#10b981','#f59e0b','#c084fc','#f43f5e']
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {pieces.map(i => (
        <div
          key={i}
          className="absolute"
          style={{
            left:            `${4 + (i * 3.9)}%`,
            top:             '-10px',
            width:           `${4 + Math.random() * 6}px`,
            height:          `${8 + Math.random() * 8}px`,
            background:      colors[i % colors.length],
            borderRadius:    Math.random() > 0.5 ? '50%' : 2,
            animation:       `confetti-fall ${1.5 + (i % 7) * 0.3}s ease-in ${(i % 5) * 0.15}s forwards`,
            transform:       `rotate(${Math.random() * 360}deg)`,
            opacity:         0,
          }}
        />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════
   ELO CHANGE COUNTER
════════════════════════════════════════════════ */
function EloCounter({ delta, from }) {
  const [displayed, setDisplayed] = useState(from)
  useEffect(() => {
    const target = from + delta
    const step   = delta > 0 ? 1 : -1
    let cur = from
    const t = setInterval(() => {
      cur += step
      setDisplayed(cur)
      if (cur === target) clearInterval(t)
    }, Math.abs(1200 / delta))  // ~1.2s total
    return () => clearInterval(t)
  }, [delta, from])

  return (
    <span className="font-display font-black text-5xl tabular-nums" style={{ color: delta > 0 ? '#10b981' : '#f43f5e' }}>
      {displayed}
    </span>
  )
}

/* ════════════════════════════════════════════════
   RESULT PAGE
════════════════════════════════════════════════ */
export default function Result() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const winner = state?.winner
  const loser  = state?.loser

  // Determine if current user is the winner
  const isIWinner = winner
    ? (winner.userId ? winner.userId === user?.id : (winner.username && user?.username && winner.username.toLowerCase() === user.username.toLowerCase()))
    : false

  const isWin  = state?.result === 'WIN' || isIWinner
  const isDraw = state?.result === 'DRAW' || (!state?.result && !winner && !loser)
  const isLoss = !isWin && !isDraw

  // Who am I?
  const myData  = isWin ? winner : (loser ?? { username: user?.username, rating: user?.elo_rating, delta: -18 })
  const oppData = isWin ? (loser ?? { username: 'Opponent', rating: 1200 }) : (winner ?? { username: 'Opponent', rating: 1200 })

  const isCustomMatch = state?.isCustom || state?.roomId?.includes('custom')
  const myDelta  = isCustomMatch ? 0 : (myData?.delta ?? (isWin ? 18 : isDraw ? 0 : -18))
  const myRating = user?.elo_rating ?? 1200

  const topic      = state?.topic      ?? state?.matchState?.topic      ?? '—'
  const difficulty = state?.difficulty ?? state?.matchState?.difficulty ?? '—'

  return (
    <>
      {/* Confetti only on win */}
      {isWin && <Confetti />}

      {/* Inject confetti keyframes once */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0)    rotate(0deg);   opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-5 relative z-10">
        <div className="w-full max-w-lg space-y-6">

          {/* ── Big result card ────────────────────────────── */}
          <div style={{
            background:   isWin ? 'rgba(16,185,129,0.05)' : isDraw ? 'rgba(107,114,128,0.05)' : 'rgba(244,63,94,0.05)',
            border:       `1px solid ${isWin ? 'rgba(16,185,129,0.35)' : isDraw ? '#1e2130' : 'rgba(244,63,94,0.3)'}`,
            borderRadius: 6,
            overflow:     'hidden',
          }}>
            {/* Header */}
            <div className="px-8 py-8 text-center"
                 style={{ borderBottom: '1px solid #1e2130' }}>
              <p className="font-mono text-[11px] uppercase tracking-widest mb-3"
                 style={{ color: state?.isForfeit ? '#f97316' : isCustomMatch ? '#22d3ee' : '#4b5563', letterSpacing: '0.14em' }}>
                {state?.isForfeit
                  ? `// ${state.forfeitUser === user?.username ? 'match forfeited (disconnected)' : 'forfeit victory (opponent disconnected)'}`
                  : isCustomMatch
                  ? '// casual friend match (unranked)'
                  : '// ranked match complete'}
              </p>

              {/* Result label */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-5xl leading-none">
                  {isWin ? '🏆' : isDraw ? '🤝' : '💀'}
                </span>
                <span className="font-display font-black"
                      style={{
                        fontSize: 64,
                        lineHeight: 1,
                        color: isWin ? '#10b981' : isDraw ? '#9ca3af' : '#f43f5e',
                        letterSpacing: '-0.03em',
                      }}>
                  {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                </span>
              </div>

              {/* Opponent line */}
              {oppData && (
                <p className="font-mono text-[12px]" style={{ color: '#4b5563' }}>
                  vs{' '}
                  <span style={{ color: '#dde1ea' }}>{oppData.username}</span>
                  {' '}({oppData.rating} elo)
                </p>
              )}
            </div>

            {/* Elo delta */}
            <div className="px-8 py-6 text-center" style={{ borderBottom: '1px solid #1e2130' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-3"
                 style={{ color: '#4b5563', letterSpacing: '0.13em' }}>
                // rating change
              </p>
              {isCustomMatch ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-sm px-3 py-1 font-bold"
                        style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 3 }}>
                    Unranked Casual Match · Rating Unchanged ({myRating})
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline justify-center gap-3">
                  <span className="font-mono text-lg" style={{ color: '#374151' }}>{myRating}</span>
                  <span className="font-mono text-2xl" style={{ color: '#374151' }}>→</span>
                  <EloCounter delta={myDelta} from={myRating} />
                  <span className="font-mono text-xl font-bold"
                        style={{ color: myDelta >= 0 ? '#10b981' : '#f43f5e' }}>
                    ({myDelta > 0 ? `+${myDelta}` : myDelta})
                  </span>
                </div>
              )}
            </div>

            {/* Match summary */}
            <div className="px-8 py-5 grid grid-cols-2 gap-4">
              {[
                { lbl:'topic',      val: topic },
                { lbl:'difficulty', val: difficulty },
                { lbl:'my verdict', val: isWin ? 'ACCEPTED' : isLoss ? 'ACCEPTED (opp)' : 'TIME UP' },
                { lbl:'room',       val: state?.roomId?.slice(0,16) ?? '—' },
              ].map(r => (
                <div key={r.lbl}>
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                     style={{ color: '#374151', letterSpacing: '0.12em' }}>{r.lbl}</p>
                  <p className="font-mono text-[12px] font-bold" style={{ color: '#dde1ea' }}>{r.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Share line ─────────────────────────────────── */}
          {isWin && (
            <p className="font-mono text-[11px] text-center" style={{ color: '#374151' }}>
              🔥 <span style={{ color: '#f97316' }}>{user?.username}</span> just beat{' '}
              <span style={{ color: '#dde1ea' }}>{oppData?.username}</span> on {topic} — algo_arena
            </p>
          )}

          {/* ── Action buttons ─────────────────────────────── */}
          <div className="flex gap-3">
            <button
              id="play-again-btn"
              onClick={() => navigate('/lobby')}
              className="flex-1 py-3 font-mono font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: '#f97316', color: '#07080c', border: 'none', borderRadius: 4 }}
            >
              play_again() →
            </button>
            <button
              id="view-profile-btn"
              onClick={() => navigate('/profile')}
              className="flex-1 py-3 font-mono text-sm transition-all active:scale-[0.98]"
              style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #1e2130', borderRadius: 4 }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'}
              onMouseOut={e  => e.currentTarget.style.borderColor = '#1e2130'}
            >
              view_profile()
            </button>
          </div>

          {/* ── Motivational copy ──────────────────────────── */}
          <p className="font-mono text-[10px] text-center" style={{ color: '#374151' }}>
            {isWin
              ? `rating ${myRating} → ${myRating + myDelta} · keep the streak going`
              : isDraw
              ? 'no rating change · comeback starts now'
              : `rating ${myRating} → ${myRating + myDelta} · study the topic and rematch`}
          </p>
        </div>
      </div>
    </>
  )
}
