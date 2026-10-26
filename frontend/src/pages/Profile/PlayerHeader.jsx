import React from 'react'
import { UserAvatar } from '../../utils/avatar'
import { IconLock } from '../../components/icons'
import { getTierForRating, getTierProgress } from '../../lib/tiers'

export default function PlayerHeader({
  activeUser,
  isMe,
  elo,
  eloHistory = [],
  matches = [],
  setShowAvatarModal,
  editingUsername,
  setEditingUsername,
  newHandle,
  setNewHandle,
  handleErr,
  savingHandle,
  handleSaveUsername,
}) {
  const username = activeUser?.username || 'Warrior'
  const totalMatches = activeUser?.total_matches ?? matches.length ?? (activeUser?.wins || 0) + (activeUser?.losses || 0)

  // Canonical tier calculation
  const canonicalTier = getTierForRating(elo)
  const TierMark = canonicalTier.Mark
  const tierProgress = getTierProgress(elo, totalMatches)

  // Peak rating and date calculation from eloHistory
  let peakPoint = null
  if (Array.isArray(eloHistory) && eloHistory.length > 0) {
    for (const pt of eloHistory) {
      if (!peakPoint || Number(pt.rating) > Number(peakPoint.rating)) {
        peakPoint = pt
      }
    }
  }
  const peakRating = peakPoint ? Math.max(Number(peakPoint.rating), Number(elo)) : Number(elo)
  let peakDateStr = ''
  if (peakPoint && peakPoint.date) {
    try {
      const dt = new Date(peakPoint.date)
      peakDateStr = ` on ${dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } catch {
      peakDateStr = ''
    }
  }

  // Net change since first match
  const firstRating = eloHistory && eloHistory.length > 0
    ? (Number(eloHistory[0].old_rating) || Number(eloHistory[0].rating) || 1200)
    : 1200
  const netSinceFirst = Number(elo) - firstRating
  const netSign = netSinceFirst > 0 ? `+${netSinceFirst}` : `${netSinceFirst}`

  // Join date: "Member since Aug 2026"
  const joinDate = activeUser?.created_at ? new Date(activeUser.created_at) : null
  const memberSinceStr = joinDate
    ? `Member since ${joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : 'Member'

  return (
    <div className="profile-header">
      {/* Left: Avatar + Details */}
      <div className="header-left">
        <div className="profile-avatar-column">
          <div className="profile-avatar-frame">
            <UserAvatar
              username={username}
              seed={activeUser?.avatar_seed}
              style={activeUser?.avatar_style}
              elo={elo}
              size={76}
              isMe={isMe}
            />
          </div>
          {isMe && (
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="avatar-change-btn"
              title="Change Avatar"
              aria-label="Change Avatar"
            >
              Change avatar
            </button>
          )}
        </div>

        <div className="header-identity">
          {/* Username / Handle line */}
          <div className="username-line">
            {isMe && !activeUser?.is_username_set && editingUsername ? (
              <form onSubmit={handleSaveUsername} className="handle-form">
                <input
                  type="text"
                  autoFocus
                  maxLength={30}
                  value={newHandle}
                  onChange={e => setNewHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="handle-input"
                  placeholder="Set handle..."
                />
                <button type="submit" disabled={savingHandle} className="btn-action">
                  {savingHandle ? '...' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditingUsername(false)} className="btn-action">
                  Cancel
                </button>
              </form>
            ) : (
              <h1 className="profile-h1">
                {username}
              </h1>
            )}

            {isMe && !activeUser?.is_username_set && !editingUsername && (
              <button
                type="button"
                onClick={() => {
                  setNewHandle(activeUser?.username || '')
                  setEditingUsername(true)
                }}
                className="handle-edit-btn"
                title="Set permanent handle"
              >
                Edit handle
              </button>
            )}
          </div>

          {handleErr && (
            <p className="font-mono text-xs text-[#ef4444] m-0">{handleErr}</p>
          )}

          {/* Under Username: Mono Meta Labels with Rank Color */}
          <div className="meta-mono-row">
            {/* Canonical Tier Badge Styled by Rank Color */}
            <span
              className="meta-item tier-badge-colored"
              style={{
                color: canonicalTier.color,
                borderColor: canonicalTier.border,
                backgroundColor: canonicalTier.bg,
              }}
            >
              <TierMark size={13} className="tier-mark-inline" />
              <span>{canonicalTier.name}</span>
            </span>

            {/* Member Since Date */}
            <span className="meta-item">
              {memberSinceStr}
            </span>

            {/* Privacy state: Locked tag on own profile if handle is permanent */}
            {isMe && activeUser?.is_username_set && (
              <span className="meta-item lock-indicator" title="Permanent handle registered">
                <IconLock size={12} />
                <span>Locked</span>
              </span>
            )}

            {/* Rank on public profiles (if provided in payload) */}
            {!isMe && activeUser?.rank && (
              <span className="meta-item">
                Rank #{activeUser.rank}
              </span>
            )}
          </div>

          {/* Institute Name with Shield/School Icon (User Requested) */}
          {activeUser?.institute && (
            <div className="player-institute-row" title="Academic / Technical Affiliation">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--sub)' }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <span className="player-institute-text">{activeUser.institute}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Rating + Quiet Subline + Tier Progress with Rank Color */}
      <div className="header-right">
        <div className="rating-display" style={{ color: canonicalTier.color }}>
          {elo}
        </div>

        {/* Quiet subline */}
        <div className="rating-meta-quiet">
          <span>Peak {peakRating}{peakDateStr}</span>
          {totalMatches > 0 && (
            <>
              <span>•</span>
              <span>{netSign} since first match</span>
            </>
          )}
        </div>

        {/* Tier Progress Bar */}
        <div className="progress-wrap">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${tierProgress.pct}%`,
                backgroundColor: canonicalTier.color,
              }}
            />
          </div>
          <span className="progress-label" style={{ color: canonicalTier.color }}>
            {tierProgress.label}
          </span>
        </div>
      </div>
    </div>
  )
}
