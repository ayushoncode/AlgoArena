import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'

/* ════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════ */
const TOPICS = [
  { id:'arrays',        label:'Arrays',         tag:'O(n)',    desc:'two pointers · sliding window · prefix sums' },
  { id:'strings',       label:'Strings',        tag:'KMP',    desc:'anagrams · palindromes · z-algorithm' },
  { id:'linked-lists',  label:'Linked Lists',   tag:'O(1)',   desc:'reversal · cycle detection · merge k' },
  { id:'trees',         label:'Trees',          tag:'O(h)',   desc:'traversal · LCA · diameter · path sums' },
  { id:'graphs',        label:'Graphs',         tag:'BFS',   desc:'shortest path · union-find · topological sort' },
  { id:'dp',            label:'Dynamic Prog.', tag:'DP',    desc:'memoization · knapsack · LCS · coin change' },
  { id:'binary-search', label:'Binary Search',  tag:'O(log)', desc:'rotated arrays · lower bound · search space' },
  { id:'sorting',       label:'Sorting',        tag:'O(nk)',  desc:'merge · quick · counting · bucket sort' },
]

const DIFFS = [
  { id:'easy',   label:'Easy',   col:'#10b981', bg:'rgba(16,185,129,0.1)'  },
  { id:'medium', label:'Medium', col:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  { id:'hard',   label:'Hard',   col:'#f43f5e', bg:'rgba(244,63,94,0.1)'   },
]

const DAILY_CHALLENGES = [
  { topic:'arrays',        problem:'Two Sum',                difficulty:'easy',   desc:'Find indices of two numbers that add to target. HashMap solution.' },
  { topic:'binary-search', problem:'Search Rotated Array',  difficulty:'medium', desc:'Binary search in an array that has been rotated at some pivot.' },
  { topic:'dp',            problem:'Coin Change',            difficulty:'medium', desc:'Find the minimum number of coins to make up a given amount.' },
  { topic:'graphs',        problem:'Number of Islands',      difficulty:'medium', desc:'Count connected components using BFS or DFS flood fill.' },
  { topic:'trees',         problem:'Max Depth of Tree',      difficulty:'easy',   desc:'Find maximum depth using recursion or iterative BFS.' },
  { topic:'strings',       problem:'Longest Palindrome',     difficulty:'medium', desc:'Expand around center technique for O(n²) solution.' },
  { topic:'linked-lists',  problem:'Detect Cycle',           difficulty:'easy',   desc:"Floyd's tortoise and hare — O(1) space cycle detection." },
]

function todayChallenge() {
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return DAILY_CHALLENGES[doy % DAILY_CHALLENGES.length]
}

/* ════════════════════════════════════════════════
   LIVE COUNTER
════════════════════════════════════════════════ */
function useLiveCounter() {
  const [c, setC] = useState({ players:247, matches:12 })
  useEffect(() => {
    const t = setInterval(() => setC(prev => ({
      players: Math.max(150, prev.players + Math.floor(Math.random()*5-2)),
      matches: Math.max(1,   prev.matches + (Math.random()>0.5?1:-1)),
    })), 4000)
    return () => clearInterval(t)
  }, [])
  return c
}

/* ════════════════════════════════════════════════
   QUEUE TIMER
════════════════════════════════════════════════ */
function useQueueTimer(running) {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    if (!running) { setSec(0); return }
    const t = setInterval(() => setSec(s => s+1), 1000)
    return () => clearInterval(t)
  }, [running])
  return { sec, band: Math.floor(sec/10)*100+100 }
}

/* ════════════════════════════════════════════════
   SEARCHING OVERLAY
════════════════════════════════════════════════ */
function SearchingOverlay({ topic, difficulty, rating, onCancel }) {
  const { sec, band } = useQueueTimer(true)
  const mm   = String(Math.floor(sec/60)).padStart(2,'0')
  const ss   = String(sec%60).padStart(2,'0')
  const diff = DIFFS.find(d => d.id === difficulty)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center"
         style={{ background:'rgba(5,6,10,0.96)', backdropFilter:'blur(8px)' }}>
      <div className="flex flex-col items-center gap-8">

        {/* Pulse rings + timer */}
        <div className="relative">
          <div className="searching-ring-1"/>
          <div className="searching-ring-2"/>
          <div className="searching-ring-3"/>
          <div className="relative z-10 flex flex-col items-center justify-center"
               style={{ width:160,height:160,borderRadius:'50%',background:'#090b13',border:'1px solid rgba(249,115,22,0.3)' }}>
            <span className="font-mono text-3xl font-bold tabular-nums" style={{ color:'#f97316' }}>{mm}:{ss}</span>
            <span className="font-mono text-[10px] mt-1" style={{ color:'#4b5563' }}>searching</span>
          </div>
        </div>

        {/* Info */}
        <div className="text-center space-y-3">
          <p className="font-display font-bold text-xl" style={{ color:'#dde1ea' }}>Finding your opponent…</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] px-2 py-1" style={{ background:'rgba(249,115,22,0.1)',color:'#f97316',border:'1px solid rgba(249,115,22,0.25)',borderRadius:3 }}>{topic}</span>
            <span className="font-mono text-[11px] px-2 py-1" style={{ background:diff.bg,color:diff.col,border:`1px solid ${diff.col}40`,borderRadius:3 }}>{difficulty}</span>
            <span className="font-mono text-[11px] px-2 py-1" style={{ background:'rgba(34,211,238,0.08)',color:'#22d3ee',border:'1px solid rgba(34,211,238,0.2)',borderRadius:3 }}>±{band} of {rating}</span>
          </div>
          <p className="font-mono text-[11px]" style={{ color:'#374151' }}>band widens every 10 seconds</p>
        </div>

        <div className="flex gap-2">
          {[0,1,2,3,4].map(i=><div key={i} className="dot-pulse" style={{ animationDelay:`${i*0.15}s` }}/>)}
        </div>

        <button id="cancel-queue" onClick={onCancel}
                className="font-mono text-[11px] px-6 py-2 transition-colors"
                style={{ color:'#4b5563',border:'1px solid #1e2130',borderRadius:4 }}
                onMouseOver={e=>e.currentTarget.style.color='#f43f5e'}
                onMouseOut={e=>e.currentTarget.style.color='#4b5563'}>
          cancel_search()
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   LOBBY PAGE
════════════════════════════════════════════════ */
export default function Lobby() {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const live     = useLiveCounter()

  const [topic,   setTopic]   = useState(null)
  const [diff,    setDiff]    = useState('medium')
  const [queuing, setQueuing] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/?auth=login')
  }, [loading, isAuthenticated, navigate])

  if (loading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <p className="font-mono text-sm" style={{ color:'#4b5563' }}>loading…</p>
    </div>
  )
  if (!isAuthenticated) return null

  const elo     = user?.elo_rating ?? 1200
  const diffObj = DIFFS.find(d => d.id === diff)
  const ch      = todayChallenge()
  const { connected } = useSocket()

  function startQueue() {
    if (!topic) return
    console.log('[Lobby] join_queue', { topic, difficulty: diff, rating: elo })
    setQueuing(true)
  }

  return (
    <>
      {queuing && <SearchingOverlay topic={topic} difficulty={diff} rating={elo} onCancel={()=>setQueuing(false)}/>}

      <div className="min-h-[calc(100vh-3.5rem)]">

        {/* ── TOP BAR ───────────────────────────────────── */}
        <div style={{ borderBottom:'1px solid #1e2130', background:'#07080c' }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
                 style={{ color:'#4b5563', letterSpacing:'0.14em' }}>// find a match</p>
              <p className="font-display font-bold text-lg" style={{ color:'#dde1ea' }}>
                Pick a topic, find an opponent
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-5">
              {/* Socket status */}
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? '#10b981' : '#f59e0b', boxShadow: connected ? '0 0 5px #10b981' : 'none', flexShrink:0 }}/>
                <span className="font-mono text-[10px]" style={{ color:'#374151' }}>
                  {connected ? 'ws connected' : 'connecting…'}
                </span>
              </div>
              {/* Rating */}
              <div className="text-right hidden sm:block">
                <p className="font-mono text-[10px]" style={{ color:'#4b5563' }}>your rating</p>
                <p className="font-display font-black text-xl" style={{ color:'#f97316' }}>{elo}</p>
              </div>
              {/* Live */}
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="dot-live"/>
                  <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color:'#dde1ea' }}>{live.players}</span>
                  <span className="font-mono text-[10px]" style={{ color:'#4b5563' }}>online</span>
                </div>
                <p className="font-mono text-[10px]" style={{ color:'#374151' }}>{live.matches} active</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN ──────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 grid lg:grid-cols-[1fr_300px] gap-8">

          {/* LEFT — Daily challenge + Topic grid */}
          <div className="space-y-6">

            {/* Daily Challenge */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-3"
                 style={{ color:'#4b5563', letterSpacing:'0.13em' }}>// today's challenge</p>
              <button
                id="daily-challenge-btn"
                onClick={() => { setTopic(ch.topic); setDiff(ch.difficulty) }}
                className="w-full text-left transition-all active:scale-[0.99]"
                style={{ background:'rgba(249,115,22,0.05)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:4, overflow:'hidden' }}
                onMouseOver={e=>e.currentTarget.style.borderColor='rgba(249,115,22,0.6)'}
                onMouseOut={e=>e.currentTarget.style.borderColor='rgba(249,115,22,0.3)'}
              >
                <div className="flex items-center justify-between px-4 py-2.5"
                     style={{ borderBottom:'1px solid rgba(249,115,22,0.15)', background:'rgba(249,115,22,0.06)' }}>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color:'#f97316', letterSpacing:'0.13em' }}>
                    ★ daily challenge
                  </span>
                  <span className="font-mono text-[10px]" style={{ color:'rgba(249,115,22,0.6)' }}>
                    click to select →
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-sm mb-1" style={{ color:'#dde1ea' }}>{ch.problem}</p>
                    <p className="font-mono text-[10px]" style={{ color:'#4b5563' }}>{ch.desc}</p>
                    <p className="font-mono text-[10px] mt-1.5" style={{ color:'rgba(249,115,22,0.7)' }}>topic: {ch.topic}</p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-1 shrink-0"
                        style={{ background: DIFFS.find(d=>d.id===ch.difficulty)?.bg, color: DIFFS.find(d=>d.id===ch.difficulty)?.col,
                                 border:`1px solid ${DIFFS.find(d=>d.id===ch.difficulty)?.col}40`, borderRadius:3 }}>
                    {ch.difficulty}
                  </span>
                </div>
              </button>
            </div>

            {/* Topic grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] uppercase tracking-widest"
                   style={{ color:'#4b5563', letterSpacing:'0.13em' }}>// or pick a topic</p>
                {topic && (
                  <button onClick={()=>setTopic(null)} className="font-mono text-[10px] transition-colors"
                          style={{ color:'#374151' }}
                          onMouseOver={e=>e.target.style.color='#f43f5e'}
                          onMouseOut={e=>e.target.style.color='#374151'}>clear ✕</button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {TOPICS.map(t => {
                  const sel = topic === t.id
                  return (
                    <button key={t.id} id={`topic-${t.id}`} onClick={()=>setTopic(t.id)}
                            className="text-left p-4 transition-all duration-150 active:scale-[0.98]"
                            style={{ background:sel?'rgba(249,115,22,0.07)':'#0d0f17', border:`1px solid ${sel?'#f97316':'#1e2130'}`, borderRadius:4 }}
                            onMouseOver={e=>{ if(!sel) e.currentTarget.style.borderColor='rgba(249,115,22,0.35)' }}
                            onMouseOut={e =>{ if(!sel) e.currentTarget.style.borderColor='#1e2130' }}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-display font-semibold text-sm" style={{ color:sel?'#f97316':'#dde1ea' }}>{t.label}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5"
                              style={{ background:sel?'rgba(249,115,22,0.12)':'#0b0d14', color:sel?'#f97316':'#374151',
                                       border:`1px solid ${sel?'rgba(249,115,22,0.25)':'#1e2130'}`, borderRadius:3 }}>
                          {t.tag}
                        </span>
                      </div>
                      <p className="font-mono text-[10px]" style={{ color:'#4b5563' }}>{t.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Config + CTA */}
          <div className="flex flex-col gap-5">

            {/* Live code preview */}
            <div style={{ background:'#090b13', border:'1px solid #1e2130', borderRadius:4, overflow:'hidden' }}>
              <div className="px-4 py-2.5 flex items-center justify-between"
                   style={{ borderBottom:'1px solid #1e2130', background:'#07080c' }}>
                <span className="font-mono text-[10px]" style={{ color:'#374151' }}>// config</span>
                {topic && <span className="dot-live" style={{ width:5,height:5 }}/>}
              </div>
              <div className="px-4 py-4 font-mono text-[12px] leading-[1.8]">
                <span style={{ color:'#4b5563' }}>arena</span><span style={{ color:'#dde1ea' }}>.</span><span style={{ color:'#f97316' }}>findMatch</span><span style={{ color:'#dde1ea' }}>({'{'}</span><br/>
                <span style={{ color:'#4b5563' }}>{'  '}topic: </span><span style={{ color:'#22d3ee' }}>"{topic ?? '???'}"</span><span style={{ color:'#dde1ea' }}>,</span><br/>
                <span style={{ color:'#4b5563' }}>{'  '}difficulty: </span><span style={{ color:diffObj.col }}>"{diff}"</span><span style={{ color:'#dde1ea' }}>,</span><br/>
                <span style={{ color:'#4b5563' }}>{'  '}rating: </span><span style={{ color:'#22d3ee' }}>{elo}</span><br/>
                <span style={{ color:'#dde1ea' }}>{'})'}</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2.5"
                 style={{ color:'#4b5563', letterSpacing:'0.13em' }}>// difficulty</p>
              <div className="flex gap-2">
                {DIFFS.map(d => (
                  <button key={d.id} id={`diff-${d.id}`} onClick={()=>setDiff(d.id)}
                          className="flex-1 py-2.5 font-mono text-[11px] font-bold transition-all"
                          style={{ background:diff===d.id?d.bg:'#0d0f17', border:`1px solid ${diff===d.id?d.col:'#1e2130'}`,
                                   color:diff===d.id?d.col:'#4b5563', borderRadius:4 }}
                          onMouseOver={e=>{ if(diff!==d.id) e.currentTarget.style.borderColor=`${d.col}50` }}
                          onMouseOut={e =>{ if(diff!==d.id) e.currentTarget.style.borderColor='#1e2130' }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Elo band */}
            <div style={{ background:'#090b13', border:'1px solid #1e2130', borderRadius:4 }}>
              {[
                { lbl:'initial band', val:'±100 elo' },
                { lbl:'widens every', val:'10 seconds' },
                { lbl:'target range', val:`${elo-100} – ${elo+100}`, hi:true },
              ].map((r,i) => (
                <div key={r.lbl} className="flex justify-between px-4 py-2.5"
                     style={{ borderBottom: i<2 ? '1px solid #0d0f17' : 'none' }}>
                  <span className="font-mono text-[10px]" style={{ color:'#4b5563' }}>{r.lbl}</span>
                  <span className="font-mono text-[10px] font-bold" style={{ color:r.hi?'#f97316':'#dde1ea' }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Find Match CTA */}
            <button id="find-match-btn" onClick={startQueue} disabled={!topic}
                    className="w-full py-4 font-mono font-bold text-sm transition-all duration-150 active:scale-[0.98]"
                    style={{ background:topic?'#f97316':'#0d0f17', color:topic?'#07080c':'#374151',
                             border:`1px solid ${topic?'#f97316':'#1e2130'}`, borderRadius:4, cursor:topic?'pointer':'not-allowed' }}>
              {topic ? `find_match() →` : 'select a topic first'}
            </button>

            {/* Elo estimate */}
            <div style={{ borderTop:'1px solid #1e2130', paddingTop:'1rem' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2.5"
                 style={{ color:'#374151', letterSpacing:'0.12em' }}>// estimated elo change</p>
              {[
                { lbl:'win',  val:'+18', col:'#10b981' },
                { lbl:'loss', val:'−18', col:'#f43f5e' },
              ].map(r => (
                <div key={r.lbl} className="flex justify-between mb-1.5">
                  <span className="font-mono text-[10px]" style={{ color:'#374151' }}>{r.lbl}</span>
                  <span className="font-mono text-[10px] font-bold" style={{ color:r.col }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
