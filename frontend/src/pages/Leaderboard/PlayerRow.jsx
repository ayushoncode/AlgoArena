import React from 'react'
import { UserAvatar } from '../../utils/avatar'
import { getEloTier } from '../../utils/tierHelper'
import { IconShield } from '../../components/icons'
import PremiumBadge from '../../components/PremiumBadge'
import './Leaderboard.css'

export default function PlayerRow({
  player,
  actualRank,
  isMe,
  isPodium = false,
  isPremium = false,
  rowRef,
  onSelect,
}) {
  const tier = getEloTier(player.elo_rating)
  const TierMark = tier.Mark

  const totalMatches = (player.wins ?? 0) + (player.losses ?? 0)
  const winRate = totalMatches > 0
    ? Math.round(((player.wins ?? 0) / totalMatches) * 100)
    : 0

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <tr
      ref={rowRef}
      className={`lb-row ${isMe ? 'is-me' : ''} ${isPodium ? `lb-row-podium rank-${actualRank}` : ''}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`Rank ${actualRank}, ${player.username}, ${player.elo_rating} Elo rating${player.institute ? `, ${player.institute}` : ''}${isMe ? ', Your account' : ''}`}
    >
      {/* Desktop Column: Rank */}
      <td className="col-rank">
        <span className="lb-rank-num">#{actualRank}</span>
      </td>

      {/* Desktop Column: Player */}
      <td className="col-player">
        <div className="lb-player-cell">
          <div className="lb-player-avatar" style={{ borderColor: `${tier.color}55` }}>
            <UserAvatar
              username={player.username}
              seed={player.avatar_seed}
              style={player.avatar_style}
              elo={player.elo_rating}
              size={34}
            />
          </div>
          <div className="lb-player-meta-stack">
            <div className="lb-player-name-line">
              <span className="lb-player-username">{player.username}</span>
              {isPremium && <PremiumBadge size="xs" showLabel={false} className="ml-1" />}
              {isMe && <span className="lb-you-tag">You</span>}
            </div>
            {player.institute && (
              <div className="lb-player-institute" title={player.institute}>
                <IconShield size={11} className="lb-institute-shield" />
                <span className="lb-institute-text">{player.institute}</span>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Desktop Column: Rating */}
      <td className="col-rating">
        <span className="lb-rating-mono" style={{ color: tier.color }}>{player.elo_rating}</span>
      </td>

      {/* Desktop Column: Win Rate */}
      <td className="col-winrate">
        <div className="lb-winrate-cell">
          <div className="lb-winrate-bar-track" aria-hidden="true">
            <div
              className="lb-winrate-bar-fill"
              style={{ width: `${winRate}%` }}
            />
          </div>
          <span className="lb-winrate-pct">{winRate}%</span>
        </div>
      </td>

      {/* Desktop Column: Record */}
      <td className="col-record">
        <span className="lb-record-mono">{player.wins ?? 0}W {player.losses ?? 0}L</span>
      </td>

      {/* Desktop Column: Tier */}
      <td className="col-tier">
        <span className="lb-tier-badge" style={{ color: tier.color }}>
          <TierMark size={13} className="lb-tier-icon" />
          <span className="lb-tier-name">{tier.name}</span>
        </span>
      </td>

      {/* Mobile Streamlined View (< 700px) */}
      <td className="lb-mobile-cell" colSpan={6}>
        <div className="lb-mobile-row">
          <div className="lb-mobile-left">
            <span className="lb-rank-num">#{actualRank}</span>
            <div className="lb-player-avatar" style={{ borderColor: `${tier.color}66` }}>
              <UserAvatar
                username={player.username}
                seed={player.avatar_seed}
                style={player.avatar_style}
                elo={player.elo_rating}
                size={34}
              />
            </div>
            <div className="lb-player-meta-stack">
              <div className="lb-player-name-line">
                <span className="lb-player-username">{player.username}</span>
                {isMe && <span className="lb-you-tag">You</span>}
              </div>
              {player.institute && (
                <div className="lb-player-institute" title={player.institute}>
                  <IconShield size={11} className="lb-institute-shield" />
                  <span className="lb-institute-text">{player.institute}</span>
                </div>
              )}
            </div>
          </div>
          <div className="lb-mobile-right">
            <span className="lb-rating-mono" style={{ color: tier.color }}>{player.elo_rating}</span>
          </div>
        </div>
      </td>
    </tr>
  )
}
