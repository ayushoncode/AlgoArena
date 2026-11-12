import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePremium } from '../hooks/usePremium'
import { useSocket } from '../hooks/useSocket'
import { UserAvatar } from '../utils/avatar'
import { motion } from 'framer-motion'
import ResultV2 from './ResultV2'
import {
  Trophy, Swords, RotateCcw, User, TrendingUp, TrendingDown, Minus,
  ChevronRight, Star, Zap, Shield,
} from 'lucide-react'
import {
  HudPanel, HudButton, GhostButton, RankBadge, StatBadge, PageWrapper,
  AnimatedCounter, getArenaTier, DiffChip,
} from '../components/ui'

/* ════════════════════════════════════════════════
   CONFETTI — pure CSS particles on WIN
════════════════════════════════════════════════ */
function Confetti() {
  const colors = ['var(--c-red)', 'var(--c-blue)', 'var(--c-green)', 'var(--c-gold)', '#c084fc', '#E11D48']
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${3 + i * 3.4}%`,
            top: '-10px',
            width: `${4 + (i % 4)}px`,
            height: `${8 + (i % 5) * 2}px`,
            background: colors[i % colors.length],
            borderRadius: i % 3 === 0 ? '50%' : 2,
            animation: `confetti-fall ${1.5 + (i % 7) * 0.3}s ease-in ${(i % 5) * 0.15}s forwards`,
            transform: `rotate(${(i * 37) % 360}deg)`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════
   RESULT PAGE
════════════════════════════════════════════════ */
export default function Result() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const { emit } = useSocket()

  useEffect(() => { refreshUser() }, [refreshUser])
  useEffect(() => {
    try { emit('leave_queue') } catch {}
  }, [emit])

  const winner = state?.winner
  const loser = state?.loser

  const isIWinner = winner
    ? (winner.userId ? String(winner.userId) === String(user?.id)
      : (winner.username && user?.username && winner.username.toLowerCase() === user.username.toLowerCase()))
    : false

  const isWin  = state?.result === 'WIN' || isIWinner
  const isDraw = state?.result === 'DRAW' || (!state?.result && !winner && !loser)
  const isLoss = !isWin && !isDraw

  const myData  = isWin ? winner : (loser  ?? { username: user?.username, rating: user?.elo_rating, delta: -18 })
  const oppData = isWin ? (loser  ?? { username: 'Opponent', rating: 1200 }) : (winner ?? { username: 'Opponent', rating: 1200 })

  const oppPlayer = state?.players?.find?.(p => p.username?.toLowerCase() !== user?.username?.toLowerCase())
    || state?.matchState?.players?.find?.(p => p.username?.toLowerCase() !== user?.username?.toLowerCase())
  const resolvedOppData = {
    ...oppData,
    userId: oppData?.userId || oppData?.id || oppPlayer?.userId || oppPlayer?.id,
    id: oppData?.userId || oppData?.id || oppPlayer?.userId || oppPlayer?.id,
    username: oppData?.username || oppPlayer?.username || 'Opponent'
  }

  const isCustomMatch = state?.isCustom || state?.roomId?.includes('custom')
  const myDelta = isCustomMatch ? 0 : (myData?.delta ?? (isWin ? 18 : isDraw ? 0 : -18))

  const fromRating = myData?.oldRating ?? myData?.rating ?? user?.elo_rating ?? 1200
  const toRating   = myData?.newRating ?? (fromRating + myDelta)

  const topic      = state?.topic ?? state?.matchState?.topic ?? '—'
  const difficulty = state?.difficulty ?? state?.matchState?.difficulty ?? '—'

  const myTier  = getArenaTier(fromRating)
  const newTier = getArenaTier(toRating)
  const { isPremium } = usePremium()
  const isFreeReadEnabled = import.meta.env.VITE_DISCUSSION_FREE_READ === 'true'
  const problemSlug = state?.problemSlug || state?.slug || state?.problem?.slug || state?.matchState?.problem?.slug

  const [searchParams] = useSearchParams()
  const isLegacy = searchParams.get('ui') === 'legacy' || import.meta.env.VITE_BATTLE_UI === 'legacy'

  if (!isLegacy) {
    return (
      <ResultV2
        user={user}
        state={state}
        isWin={isWin}
        isDraw={isDraw}
        isLoss={isLoss}
        myData={myData}
        oppData={resolvedOppData}
        fromRating={fromRating}
        toRating={toRating}
        myDelta={myDelta}
        isCustomMatch={isCustomMatch}
        topic={topic}
        difficulty={difficulty}
        onPlayAgain={() => navigate('/lobby')}
        onViewProfile={() => navigate('/profile')}
        onBackToLobby={() => navigate('/lobby')}
      />
    )
  }

  // Colors per outcome
  const outcomeColor = isWin ? 'var(--c-green)' : isDraw ? 'var(--c-blue)' : 'var(--c-red)'
  const outcomeBg    = isWin ? 'rgba(16,185,129,0.06)' : isDraw ? 'rgba(56,189,248,0.06)' : 'rgba(225,29,72,0.06)'
  const outcomeBorder= isWin ? 'rgba(16,185,129,0.35)' : isDraw ? 'rgba(56,189,248,0.3)' : 'rgba(225,29,72,0.3)'

  const OutcomeIcon = isWin ? Trophy : isDraw ? Swords : Shield

  return (
    <>
      {/* Confetti only on win */}
      {isWin && <Confetti />}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0)    rotate(0deg);   opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes gold-burst {
          0%   { opacity: 0; transform: scale(0.6) rotate(-10deg); }
          60%  { opacity: 1; transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>

      <PageWrapper heroGlow={isWin}>
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-5 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg space-y-5"
          >

            {/* ── Big result card ──────────────────────────── */}
            <HudPanel
              glow={isWin}
              glowColor={`${outcomeColor}30`}
              accentTopLeft={outcomeColor}
              accentBotRight={outcomeColor}
              style={{ overflow: 'hidden', background: outcomeBg, border: `1px solid ${outcomeBorder}` }}
            >
              {/* Gold top bar (win) */}
              {isWin && (
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, transparent, var(--c-gold), transparent)` }} />
              )}

              {/* Header */}
              <div className="px-4 md:px-8 py-6 md:py-8 text-center" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <p className="font-mono text-[9px] md:text-[10px] uppercase font-bold tracking-widest mb-3"
                  style={{ color: state?.isForfeit ? 'var(--c-gold)' : isCustomMatch ? 'var(--c-blue)' : 'var(--c-text-mute)' }}>
                  {state?.isForfeit
                    ? (state.forfeitUser === user?.username ? '// Match Forfeited' : '// Forfeit Victory')
                    : isCustomMatch
                      ? '// Casual Duel (Unranked)'
                      : '// Ranked Match Complete'}
                </p>

                {/* Outcome */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center gap-2 md:gap-3 mb-4"
                >
                  <OutcomeIcon className="w-10 h-10 md:w-12 md:h-12" style={{ color: outcomeColor }} strokeWidth={1.5} />
                  <span className="font-display font-black tracking-tight text-[56px] md:text-[72px]"
                    style={{ lineHeight: 1, color: outcomeColor, letterSpacing: '-0.03em' }}
                  >
                    {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                  </span>
                </motion.div>

                {/* VS avatars */}
                <div className="flex items-center justify-center gap-4 my-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar username={user?.username} seed={user?.avatar_seed} style={user?.avatar_style} size={36} isMe={true} />
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--c-red)' }}>{user?.username}</span>
                  </div>
                  <span className="font-display font-black text-sm" style={{ color: 'var(--c-text-mute)' }}>VS</span>
                  <div className="flex items-center gap-2">
                    <UserAvatar username={oppData?.username} seed={oppData?.avatar_seed} style={oppData?.avatar_style} size={36} isMe={false} />
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--c-blue)' }}>{oppData?.username ?? 'Opponent'}</span>
                  </div>
                </div>
              </div>

              {/* Elo delta */}
              <div className="px-4 md:px-8 py-5 md:py-6 text-center" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <p className="font-mono text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-[var(--c-text-mute)] mb-3">Rating Change</p>
                {isCustomMatch ? (
                  <StatBadge label="Unranked Match" value={`${fromRating} Elo Unchanged`} color="var(--c-blue)" />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="flex items-baseline justify-center gap-2 md:gap-3"
                  >
                    <span className="font-mono text-base md:text-lg" style={{ color: 'var(--c-text-mute)' }}>{fromRating}</span>
                    <span className="font-mono text-xl md:text-2xl" style={{ color: 'var(--c-border2)' }}>→</span>
                    <AnimatedCounter
                      value={toRating}
                      className="font-display font-black text-5xl tabular-nums"
                      style={{ color: myDelta >= 0 ? 'var(--c-green)' : 'var(--c-red)' }}
                    />
                    <span className="font-mono text-xl font-bold" style={{ color: myDelta >= 0 ? 'var(--c-green)' : 'var(--c-red)' }}>
                      ({myDelta > 0 ? '+' : ''}{myDelta})
                    </span>
                  </motion.div>
                )}

                {/* Rank progression */}
                {!isCustomMatch && myTier.name !== newTier.name && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <RankBadge elo={fromRating} size="sm" />
                    <ChevronRight size={14} style={{ color: 'var(--c-text-mute)' }} />
                    <RankBadge elo={toRating} size="sm" />
                    <span className="font-mono text-[10px] font-bold" style={{ color: isWin ? 'var(--c-green)' : 'var(--c-red)' }}>
                      {isWin ? 'Rank Up!' : 'Rank Down'}
                    </span>
                  </div>
                )}
                {!isCustomMatch && myTier.name === newTier.name && (
                  <div className="mt-2">
                    <RankBadge elo={toRating} size="sm" />
                  </div>
                )}
              </div>

              {/* Match summary */}
              <div className="px-4 md:px-8 py-4 md:py-5 grid grid-cols-2 gap-3 md:gap-4">
                {[
                  { lbl: 'Topic',      val: topic },
                  { lbl: 'Difficulty', val: <DiffChip difficulty={difficulty} /> },
                  { lbl: 'Verdict',    val: isWin ? 'Accepted' : isLoss ? 'Rival Solved First' : 'Time Up' },
                  { lbl: 'Room',       val: state?.roomId?.slice(0, 14) ?? '—' },
                ].map(r => (
                  <div key={r.lbl}>
                    <p className="font-mono text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-[var(--c-text-mute)] mb-0.5">{r.lbl}</p>
                    <p className="font-mono text-[12px] font-bold" style={{ color: 'var(--c-text)' }}>{r.val}</p>
                  </div>
                ))}
              </div>
            </HudPanel>

            {/* Share line */}
            {isWin && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-mono text-[11px] text-center"
                style={{ color: 'var(--c-text-mute)' }}
              >
                <span style={{ color: 'var(--c-red)' }}>{user?.username}</span> defeated{' '}
                <span style={{ color: 'var(--c-text)' }}>{oppData?.username}</span> on {topic} — AlgoArena
              </motion.p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <HudButton id="play-again-btn" onClick={() => navigate('/lobby')} className="flex-1 py-3">
                <Swords size={14} /> Play Again
              </HudButton>
              <GhostButton id="view-profile-btn" onClick={() => navigate('/profile')} className="flex-1 py-3">
                <User size={14} /> Profile
              </GhostButton>
            </div>

            {/* Discuss this problem link */}
            {problemSlug && (isPremium || isFreeReadEnabled) && (
              <div className="text-center">
                <Link
                  to={`/discuss/${problemSlug}`}
                  className="font-mono text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2"
                >
                  Discuss this problem
                </Link>
              </div>
            )}

            {/* Motivational */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="font-mono text-[10px] text-center"
              style={{ color: 'var(--c-text-mute)' }}
            >
              {isWin
                ? `Elo ${fromRating} → ${toRating} · Keep the streak going`
                : isDraw
                  ? 'No rating change · Comeback starts now'
                  : `Elo ${fromRating} → ${toRating} · Study the topic and rematch`}
            </motion.p>
          </motion.div>
        </div>
      </PageWrapper>
    </>
  )
}
