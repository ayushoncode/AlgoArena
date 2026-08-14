import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStreak } from '../hooks/useStreak'
import api from '../utils/api'

/* ════════════════════════════════════════════════
   SVG ELO CHART
════════════════════════════════════════════════ */
const W = 600, H = 180, PAD = { top: 20, right: 20, bottom: 32, left: 48 }

function EloChart({ data }) {
  const [hovered, setHovered] = useState(null)
  if (!data || data.length === 0) return null

  const inner = { w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom }
  const ratings  = data.map(d => d.rating)
  const minR     = Math.min(...ratings) - 20
  const maxR     = Math.max(...ratings) + 20
  const rangeR   = maxR - minR || 1

  const xScale = i => data.length === 1 ? inner.w / 2 : (i / (data.length - 1)) * inner.w
  const yScale = r => inner.h - ((r - minR) / rangeR) * inner.h

  const pts = data.map((d, i) => [xScale(i), yScale(d.rating)])

  function buildPath(points) {
    if (points.length === 1) return `M 0 ${points[0][1]} L ${inner.w} ${points[0][1]}`
    let d = `M ${points[0][0]} ${points[0][1]}`
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1]
      const [x1, y1] = points[i]
      const cx = (x0 + x1) / 2
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
    }
    return d
  }

  const linePath = buildPath(pts)
  const areaPath = linePath + ` L ${pts[pts.length-1][0]} ${inner.h} L ${pts[0][0]} ${inner.h} Z`

  const gridCount = 4
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const r = minR + (rangeR / gridCount) * i
    const y = yScale(r)
    return { y, label: Math.round(r) }
  })

  const step = Math.max(1, Math.floor(data.length / 6))
  const xLabels = data
    .map((d, i) => ({ i, label: String(d.date).slice(5, 10), x: xScale(i) }))
    .filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f97316" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
          </linearGradient>
          <clipPath id="eloClip">
            <rect x="0" y="0" width={inner.w} height={inner.h}/>
          </clipPath>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {gridLines.map(({ y, label }) => (
            <g key={label}>
              <line x1={0} y1={y} x2={inner.w} y2={y} stroke="#1e2130" strokeWidth={1}/>
              <text x={-8} y={y + 4} textAnchor="end" fontSize={9} fill="#374151" fontFamily="JetBrains Mono, monospace">
                {label}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#eloGrad)" clipPath="url(#eloClip)"/>
          <path d={linePath} fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" clipPath="url(#eloClip)"/>

          {xLabels.map(({ x, label }) => (
            <text key={label} x={x} y={inner.h + 20} textAnchor="middle" fontSize={9} fill="#374151" fontFamily="JetBrains Mono, monospace">
              {label}
            </text>
          ))}

          {pts.map(([x, y], i) => (
            <rect
              key={i}
              x={x - 10}
              y={0}
              width={20}
              height={inner.h}
              fill="transparent"
              onMouseEnter={() => setHovered({ x, y, ...data[i] })}
              style={{ cursor: 'crosshair' }}
            />
          ))}

          {hovered && (
            <>
              <line x1={hovered.x} y1={0} x2={hovered.x} y2={inner.h} stroke="rgba(249,115,22,0.3)" strokeWidth={1} strokeDasharray="4 2"/>
              <circle cx={hovered.x} cy={hovered.y} r={4} fill="#f97316" stroke="#090b13" strokeWidth={2}/>
              <g transform={`translate(${Math.min(hovered.x, inner.w - 90)}, ${Math.max(0, hovered.y - 40)})`}>
                <rect x={0} y={0} width={80} height={32} rx={3} fill="#0d0f17" stroke="#1e2130"/>
                <text x={8} y={13} fontSize={9} fill="#4b5563" fontFamily="JetBrains Mono, monospace">{String(hovered.date).slice(0, 10)}</text>
                <text x={8} y={26} fontSize={11} fill="#f97316" fontFamily="JetBrains Mono, monospace" fontWeight="bold">{hovered.rating}</text>
              </g>
            </>
          )}
        </g>
      </svg>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STREAK MINI-CALENDAR (30 days)
════════════════════════════════════════════════ */
function StreakCalendar({ history }) {
  const today = new Date().toISOString().slice(0, 10)
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const date = d.toISOString().slice(0, 10)
    return { date, active: history.has(date), isToday: date === today }
  })

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
      {days.map(({ date, active, isToday }) => (
        <div
          key={date}
          title={date}
          className="aspect-square"
          style={{
            borderRadius: 3,
            background: active ? (isToday ? '#f97316' : 'rgba(249,115,22,0.5)') : '#0d0f17',
            border: `1px solid ${isToday ? '#f97316' : active ? 'rgba(249,115,22,0.3)' : '#1e2130'}`,
            boxShadow: isToday ? '0 0 6px rgba(249,115,22,0.35)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════
   MATCH HISTORY ROW
════════════════════════════════════════════════ */
function MatchRow({ m }) {
  const win = m.result === 'WIN'
  const deltaStr = m.elo_delta ? (m.elo_delta > 0 ? `+${m.elo_delta}` : `${m.elo_delta}`) : '0'
  const dateStr = m.ended_at ? new Date(m.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors"
         style={{ borderBottom: '1px solid #0d0f17' }}
         onMouseOver={e => e.currentTarget.style.background = '#0d0f17'}
         onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>

      <span className="font-mono text-[10px] font-bold px-2 py-0.5 shrink-0"
            style={{ borderRadius: 3, background: win ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                     color: win ? '#10b981' : '#f43f5e', border: `1px solid ${win ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`, width: 40, textAlign: 'center' }}>
        {m.result}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-[12px]" style={{ color: '#dde1ea' }}>vs {m.opponent || 'Opponent'}</p>
        <p className="font-mono text-[10px]" style={{ color: '#4b5563' }}>{m.topic} · {m.difficulty}</p>
      </div>

      <span className="font-mono text-[12px] font-bold shrink-0 w-12 text-right"
            style={{ color: win ? '#10b981' : '#f43f5e' }}>
        {deltaStr}
      </span>

      <span className="font-mono text-[10px] shrink-0 hidden sm:block" style={{ color: '#374151', width: 70, textAlign: 'right' }}>
        {dateStr}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STAT CARD
════════════════════════════════════════════════ */
function StatCard({ label, value, sub, color = '#dde1ea' }) {
  return (
    <div className="px-4 py-4" style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 4 }}>
      <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
        {label}
      </p>
      <p className="font-display font-black text-3xl leading-none" style={{ color }}>
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] mt-1" style={{ color: '#374151' }}>{sub}</p>}
    </div>
  )
}

/* ════════════════════════════════════════════════
   PROFILE PAGE
════════════════════════════════════════════════ */
export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth()
  const { streak, history } = useStreak()
  const navigate = useNavigate()

  const [profileUser, setProfileUser] = useState(user)
  const [matches, setMatches]         = useState([])
  const [eloHistory, setEloHistory]   = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    async function fetchUserData() {
      try {
        setDataLoading(true)
        const [meRes, histRes, eloRes] = await Promise.all([
          api.get('/api/users/me').catch(() => ({ data: null })),
          api.get('/api/users/me/history').catch(() => ({ data: [] })),
          api.get('/api/users/me/elo-history').catch(() => ({ data: [] })),
        ])
        if (meRes.data) setProfileUser(meRes.data)
        setMatches(histRes.data || [])
        setEloHistory(eloRes.data || [])
      } catch (err) {
        console.error('[Profile API Error]', err)
      } finally {
        setDataLoading(false)
      }
    }

    fetchUserData()
  }, [isAuthenticated])

  if (authLoading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <p className="font-mono text-sm" style={{ color: '#4b5563' }}>loading profile...</p>
    </div>
  )

  if (!authLoading && !isAuthenticated) {
    navigate('/?auth=login')
    return null
  }

  const activeUser = profileUser || user
  const elo    = activeUser?.elo_rating ?? 1200
  const wins   = activeUser?.wins   ?? 0
  const losses = activeUser?.losses ?? 0
  const total  = wins + losses
  const wr     = total > 0 ? Math.round((wins / total) * 100) : 0

  // Topic distribution from actual match history
  const topicFreq = matches.reduce((acc, m) => {
    if (m.topic) acc[m.topic] = (acc[m.topic] || 0) + 1
    return acc
  }, {})
  const favTopic = Object.entries(topicFreq).sort((a,b) => b[1] - a[1])[0]?.[0] ?? '—'

  // Construct chart points from real Elo history or single baseline
  const chartData = eloHistory.length > 0
    ? eloHistory.map(e => ({ date: e.date, rating: e.rating }))
    : [
        { date: activeUser?.created_at ? new Date(activeUser.created_at).toISOString().slice(0,10) : 'Start', rating: 1200 },
        { date: new Date().toISOString().slice(0,10), rating: elo }
      ]

  const peakElo   = eloHistory.length > 0 ? Math.max(...eloHistory.map(e => e.rating), elo) : elo
  const startElo  = eloHistory[0]?.rating ?? 1200
  const netChange = elo - startElo

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">

      {/* ── PROFILE HERO ──────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">

            {/* Avatar */}
            <div className="flex items-center justify-center font-display font-black text-4xl shrink-0"
                 style={{ width: 88, height: 88, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6, color: '#f97316' }}>
              {(activeUser?.username?.[0] ?? 'A').toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-display font-black text-2xl" style={{ color: '#dde1ea' }}>
                  {activeUser?.username}
                </h1>
                {/* Rank badge */}
                {elo >= 1800
                  ? <span className="font-mono text-[11px] px-2 py-0.5 font-bold" style={{ background: 'rgba(250,204,21,0.12)', color: '#fbbf24', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 3 }}>MASTER</span>
                  : elo >= 1500
                  ? <span className="font-mono text-[11px] px-2 py-0.5 font-bold" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 3 }}>EXPERT</span>
                  : <span className="font-mono text-[11px] px-2 py-0.5 font-bold" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 3 }}>CODER</span>
                }
                <span className="font-mono text-[11px]" style={{ color: '#374151' }}>
                  joined {new Date(activeUser?.created_at ?? Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-5xl" style={{ color: '#f97316' }}>{elo}</span>
                <span className="font-mono text-sm" style={{ color: '#4b5563' }}>elo</span>
                <span className="font-mono text-sm font-bold" style={{ color: netChange >= 0 ? '#10b981' : '#f43f5e' }}>
                  {netChange >= 0 ? `+${netChange}` : netChange} total
                </span>
              </div>
            </div>

            {/* Streak pill */}
            <div className="flex items-center gap-3 px-5 py-3"
                 style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 4 }}>
              <span className="text-2xl">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✦'}</span>
              <div>
                <p className="font-display font-black text-2xl leading-none" style={{ color: '#f97316' }}>{streak}</p>
                <p className="font-mono text-[10px]" style={{ color: '#4b5563' }}>day streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="rating"     value={elo}               sub={`peak ${peakElo}`}        color="#f97316" />
          <StatCard label="wins"       value={wins}              sub={`${wr}% win rate`}         color="#10b981" />
          <StatCard label="losses"     value={losses}            sub={`${total} total`}          color="#f43f5e" />
          <StatCard label="streak"     value={`${streak}d`}      sub="current"                   color="#f97316" />
          <StatCard label="matches"    value={total}             sub="played"                              />
          <StatCard label="fav topic"  value={favTopic.split('-')[0]} sub={favTopic}                        />
        </div>

        {/* Elo chart */}
        <div style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 4, overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-5 py-3"
               style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
                // rating history
              </p>
              <p className="font-mono text-[11px] mt-0.5" style={{ color: '#374151' }}>real elo progression</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="font-mono text-[10px]" style={{ color: '#4b5563' }}>peak</p>
                <p className="font-mono text-sm font-bold" style={{ color: '#f97316' }}>{peakElo}</p>
              </div>
              <div>
                <p className="font-mono text-[10px]" style={{ color: '#4b5563' }}>current</p>
                <p className="font-mono text-sm font-bold" style={{ color: '#dde1ea' }}>{elo}</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-5">
            <EloChart data={chartData} />
          </div>
        </div>

        {/* Bottom grid — streak calendar + match history */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">

          {/* Match history */}
          <div style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 4, overflow: 'hidden' }}>
            <div className="px-4 py-3 flex items-center justify-between"
                 style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
                // match history
              </p>
              <span className="font-mono text-[10px]" style={{ color: '#374151' }}>{matches.length} matches</span>
            </div>

            {dataLoading ? (
              <div className="p-8 text-center">
                <p className="font-mono text-xs" style={{ color: '#4b5563' }}>loading match history...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="font-mono text-sm" style={{ color: '#6b7280' }}>No match history yet.</p>
                <button
                  onClick={() => navigate('/lobby')}
                  className="font-mono text-xs px-4 py-2 font-bold transition-all"
                  style={{ background: '#f97316', color: '#07080c', borderRadius: 4 }}
                >
                  find_match() →
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: '1px solid #1e2130' }}>
                  {['result','opponent / topic','Δelo','date'].map(h => (
                    <span key={h} className="font-mono text-[9px] uppercase" style={{ color: '#374151',
                      flex: h==='opponent / topic' ? 1 : 0, width: h==='result' ? 40 : h==='Δelo' ? 48 : 70,
                      textAlign: h==='date' || h==='Δelo' ? 'right' : undefined }}>
                      {h}
                    </span>
                  ))}
                </div>
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {matches.map(m => <MatchRow key={m.id} m={m} />)}
                </div>
              </>
            )}
          </div>

          {/* Activity / Streak calendar */}
          <div style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 4, overflow: 'hidden' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
                // activity — last 30 days
              </p>
            </div>
            <div className="px-4 py-5 space-y-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✦'}</span>
                <span className="font-display font-black text-5xl" style={{ color: '#f97316' }}>{streak}</span>
                <span className="font-mono text-sm" style={{ color: '#4b5563' }}>day streak</span>
              </div>

              <StreakCalendar history={history} />

              <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid #1e2130' }}>
                {[
                  { col: '#f97316', lbl: 'today' },
                  { col: 'rgba(249,115,22,0.5)', lbl: 'active' },
                  { col: '#0d0f17', lbl: 'missed' },
                ].map(l => (
                  <div key={l.lbl} className="flex items-center gap-1.5">
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: l.col, border: '1px solid rgba(249,115,22,0.2)', flexShrink: 0 }}/>
                    <span className="font-mono text-[9px]" style={{ color: '#374151' }}>{l.lbl}</span>
                  </div>
                ))}
              </div>

              {/* Topic breakdown from real matches */}
              <div style={{ borderTop: '1px solid #1e2130', paddingTop: '1rem' }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
                  // topic breakdown
                </p>
                {Object.keys(topicFreq).length === 0 ? (
                  <p className="font-mono text-[10px]" style={{ color: '#374151' }}>no matches played yet</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(topicFreq)
                      .sort((a,b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([topic, count]) => (
                        <div key={topic}>
                          <div className="flex justify-between mb-1">
                            <span className="font-mono text-[10px]" style={{ color: '#9ca3af' }}>{topic}</span>
                            <span className="font-mono text-[10px]" style={{ color: '#4b5563' }}>{count}</span>
                          </div>
                          <div style={{ height: 3, background: '#0d0f17', borderRadius: 2 }}>
                            <div style={{ height: 3, width: `${(count / matches.length) * 100}%`, background: '#f97316', borderRadius: 2, transition: 'width 0.5s ease' }}/>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
