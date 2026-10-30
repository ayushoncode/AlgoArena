import React, { useEffect, useRef } from 'react'
import { ArenaLogo } from '../../components/ArenaLogo'
import { getEloTier } from '../../utils/tierHelper'
import { usePremium } from '../../hooks/usePremium'
import { usePremiumBadges } from '../../hooks/usePremiumBadges'
import PremiumBadge from '../../components/PremiumBadge'

function FlagIcon({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 14.5V2.5h9l-2 4 2 4H2.5" />
    </svg>
  )
}

function ClockIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
  )
}

function formatTopic(rawTopic) {
  if (!rawTopic || rawTopic === '—' || rawTopic === '-') return 'General'
  return String(rawTopic)
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function formatDifficulty(diff) {
  const d = String(diff || 'medium').toLowerCase()
  if (d === 'easy') return { label: 'Easy', color: 'var(--ok, #10b981)', border: 'rgba(16, 185, 129, 0.3)' }
  if (d === 'hard') return { label: 'Hard', color: 'var(--bad, #f43f5e)', border: 'rgba(244, 63, 94, 0.3)' }
  return { label: 'Medium', color: 'var(--warn, #f59e0b)', border: 'rgba(245, 158, 11, 0.3)' }
}

export default function TopBarV2({
  topic,
  difficulty,
  roomId,
  timerDisplay,
  remaining,
  me,
  opp,
  user,
  onOpenResign,
}) {
  const { isPremium: isMePremium } = usePremium()
  const oppBadges = usePremiumBadges(opp?.username ? [opp.username] : [], opp?.id ? [opp.id] : [])
  const isOppPremium = Boolean(opp?.username && (oppBadges[opp.username.toLowerCase()] || oppBadges[opp.id]))

  const diffCfg = formatDifficulty(difficulty)
  const formattedTopic = formatTopic(topic)

  // Timer color states
  const timerClass =
    remaining < 60
      ? 'battle-v2__timer--bad'
      : remaining < 300
      ? 'battle-v2__timer--warn'
      : 'battle-v2__timer--normal'

  // Aria announcements at 5m, 1m, 10s
  const lastAnnounced = useRef(null)
  const [ariaAnnouncement, setAriaAnnouncement] = React.useState('')

  useEffect(() => {
    if (remaining === 300 && lastAnnounced.current !== 300) {
      lastAnnounced.current = 300
      setAriaAnnouncement('Five minutes remaining')
    } else if (remaining === 60 && lastAnnounced.current !== 60) {
      lastAnnounced.current = 60
      setAriaAnnouncement('One minute remaining')
    } else if (remaining === 10 && lastAnnounced.current !== 10) {
      lastAnnounced.current = 10
      setAriaAnnouncement('Ten seconds remaining')
    }
  }, [remaining])

  return (
    <header className="battle-v2__topbar" role="banner">
      {/* Hidden aria-live region */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </span>

      {/* Left: Emblem, Topic, Diff, Room ID */}
      <div className="battle-v2__topbar-left">
        <div className="battle-v2__logo-box">
          <ArenaLogo size={20} />
        </div>
        <span className="battle-v2__topic-label">{formattedTopic}</span>
        <span
          className="battle-v2__diff-badge"
          style={{ color: diffCfg.color, borderColor: diffCfg.border }}
        >
          {diffCfg.label}
        </span>
        <span className="battle-v2__dot-divider hidden xl:inline" aria-hidden="true">
          ·
        </span>
        <span className="battle-v2__room-id hidden xl:inline">
          {roomId?.slice(0, 14)}
        </span>
      </div>

      {/* Center: 22px tabular mono countdown timer */}
      <div className="battle-v2__timer-wrap" aria-label={`Match time remaining: ${timerDisplay}`}>
        <span className={timerClass} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ClockIcon size={14} />
        </span>
        <span className={`battle-v2__timer-text ${timerClass}`}>{timerDisplay}</span>
      </div>

      {/* Right: Players & Resign */}
      <div className="battle-v2__topbar-right">
        {(() => {
          const myRating = me?.rating ?? user?.elo_rating ?? 1200
          const oppRating = opp?.rating ?? 1200
          const myTier = getEloTier(myRating)
          const oppTier = getEloTier(oppRating)
          return (
            <div className="battle-v2__players-summary hidden lg:flex">
              <div className="battle-v2__player-you">
                <span className="flex items-center gap-1">
                  <span>{me?.username ?? user?.username ?? 'You'}</span>
                  {isMePremium && <PremiumBadge size="xs" showLabel={false} />}
                </span>
                <span className="battle-v2__you-tag">You</span>
                <span
                  className="battle-v2__tier-badge"
                  style={{
                    color: myTier.color,
                    borderColor: myTier.border,
                    backgroundColor: myTier.bg,
                  }}
                  title={`${myTier.name} (${myRating})`}
                >
                  <myTier.Mark size={11} />
                  <span>{myRating}</span>
                </span>
              </div>
              <span className="battle-v2__dot-divider" aria-hidden="true">
                vs
              </span>
              <div className="battle-v2__player-rival">
                <span
                  className="battle-v2__tier-badge"
                  style={{
                    color: oppTier.color,
                    borderColor: oppTier.border,
                    backgroundColor: oppTier.bg,
                  }}
                  title={`${oppTier.name} (${oppRating})`}
                >
                  <oppTier.Mark size={11} />
                  <span>{oppRating}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>{opp?.username ?? 'Opponent'}</span>
                  {isOppPremium && <PremiumBadge size="xs" showLabel={false} />}
                </span>
              </div>
            </div>
          )
        })()}

        <button
          type="button"
          onClick={onOpenResign}
          className="battle-v2__resign-btn"
          title="Resign and exit match"
          aria-label="Resign and exit match"
        >
          <FlagIcon size={12} />
          <span className="hidden sm:inline">Resign</span>
        </button>
      </div>
    </header>
  )
}

