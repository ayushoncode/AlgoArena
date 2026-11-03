import React, { useState, useRef, useEffect } from 'react'
import { UserAvatar } from '../../utils/avatar'
import { getTierForRating } from '../../lib/tiers'
import ProfileSkillsCard from './ProfileSkillsCard'
import { usePremium } from '../../hooks/usePremium'
import { usePremiumBadges } from '../../hooks/usePremiumBadges'
import PremiumBadge from '../../components/PremiumBadge'
import { IconHexagonBadge } from '../../components/icons'

export default function ProfileSidebar({
  activeUser,
  isMe,
  elo,
  setShowAvatarModal,
  setShowEditProfileModal,
  editingUsername,
  setEditingUsername,
  newHandle,
  setNewHandle,
  handleErr,
  savingHandle,
  handleSaveUsername,
  topicFreq = {},
  matches = [],
  eloHistory = [],
}) {
  const [copied, setCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const shareMenuRef = useRef(null)
  const username = activeUser?.username || 'Warrior'
  const canonicalTier = getTierForRating(elo)

  const { isPremium, status: subStatus } = usePremium()
  const badges = usePremiumBadges(isMe ? [] : [username], isMe ? [] : [activeUser?.id])
  const isPremiumUser = isMe ? isPremium : Boolean(badges[username?.toLowerCase()] || badges[activeUser?.id])
  const launchSlotNum = isMe
    ? (subStatus?.launchSlot ? subStatus?.slotNumber : null)
    : (badges[`slot:${username?.toLowerCase()}`] || badges[`slot:${activeUser?.id}`] || null)

  // Display Name: from DB display_name or name or username
  const displayName = activeUser?.display_name || activeUser?.name || username

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${encodeURIComponent(username)}`
    : ''

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy', e)
    }
  }

  const handleShareTwitter = () => {
    const text = `Check out ${displayName}'s profile on AlgoArena (Contest Rating: ${elo} Elo)!`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
    setShowShareMenu(false)
  }

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
    setShowShareMenu(false)
  }

  const handleShareWhatsApp = () => {
    const text = `Check out ${displayName}'s profile on AlgoArena: ${shareUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    setShowShareMenu(false)
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on AlgoArena`,
          text: `Check out ${displayName}'s (@${username}) profile on AlgoArena! Contest Rating: ${elo} Elo`,
          url: shareUrl,
        })
        setShowShareMenu(false)
      } catch (err) {
        // User cancelled
      }
    }
  }

  // Close share menu on outside click or escape
  useEffect(() => {
    if (!showShareMenu) return
    const handleClickOutside = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setShowShareMenu(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowShareMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showShareMenu])

  // Bio: only if user has set it in DB
  const bio = activeUser?.bio?.trim()

  // Links: only if user has set them in DB
  const location = activeUser?.location?.trim()
  const institute = activeUser?.institute?.trim()
  const website = activeUser?.website?.trim()
  const rawGithub = activeUser?.github?.trim()
  const rawLinkedin = activeUser?.linkedin?.trim()

  const websiteUrl = website ? (website.startsWith('http') ? website : `https://${website}`) : ''
  const githubUrl = rawGithub ? (rawGithub.startsWith('http') ? rawGithub : `https://github.com/${rawGithub.replace(/^@/, '')}`) : ''
  const githubHandle = rawGithub ? rawGithub.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '') : ''
  const linkedinUrl = rawLinkedin ? (rawLinkedin.startsWith('http') ? rawLinkedin : `https://linkedin.com/in/${rawLinkedin.replace(/^@/, '')}`) : ''
  const linkedinHandle = rawLinkedin ? rawLinkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') : ''

  const hasAnyLinks = Boolean(location || website || rawGithub || rawLinkedin)

  return (
    <aside className="profile-leetcode-sidebar">
      {/* ── MAIN USER CARD ─────────────────────────────────────── */}
      <div className="sidebar-user-card">
        {/* Top: Avatar + Display Name + Handle + Rank */}
        <div className="sidebar-avatar-header">
          <div className="sidebar-avatar-wrap relative">
            <UserAvatar
              username={username}
              seed={activeUser?.avatar_seed}
              style={activeUser?.avatar_style}
              elo={elo}
              size={80}
              isMe={isMe}
            />
            {isPremiumUser && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '16px',
                  border: '2px solid var(--gold, #ffd696)',
                  pointerEvents: 'none',
                  boxShadow: '0 0 14px rgba(255, 214, 150, 0.35)'
                }}
                title="Premium Member"
              />
            )}
            {isMe && (
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="avatar-change-btn"
                aria-label="Change Avatar"
              >
                Change avatar
              </button>
            )}
          </div>

          <div className="sidebar-names">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 className="sidebar-display-name" style={{ margin: 0 }}>{displayName}</h1>
              {isPremiumUser && (
                <span
                  title={launchSlotNum ? `Launch Member #${launchSlotNum}` : 'Premium Subscriber'}
                  aria-label="Premium member"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: 'var(--gold, #ffd696)',
                    verticalAlign: 'middle',
                    cursor: 'default',
                    flexShrink: 0,
                  }}
                >
                  <IconHexagonBadge size={15} />
                </span>
              )}
            </div>

            {/* Permanent AlgoArena ID Handle */}
            <span className="sidebar-handle">{username}</span>

            {/* Global Rank colored according to user's Tier */}
            <div className="sidebar-rank-row">
              <span className="sidebar-rank-label">Rank</span>
              <span
                className="sidebar-rank-value"
                style={{ color: canonicalTier.color }}
              >
                {activeUser?.rank ? Number(activeUser.rank).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio (only rendered if user has added one) */}
        {bio && (
          <p className="sidebar-bio">
            {bio}
          </p>
        )}

        {/* Action Buttons: Edit Profile (when isMe) or Share Profile (when !isMe) */}
        <div className="sidebar-actions-row" style={{ marginTop: bio ? 12 : 16 }}>
          {isMe && (
            <button
              type="button"
              className="btn-edit-profile"
              onClick={() => setShowEditProfileModal(true)}
            >
              Edit Profile
            </button>
          )}

          <div
            className="share-menu-anchor"
            ref={shareMenuRef}
            style={!isMe ? { width: '100%' } : undefined}
          >
            {isMe ? (
              <button
                type="button"
                className={`btn-share-icon ${showShareMenu ? 'active' : ''}`}
                onClick={() => setShowShareMenu((prev) => !prev)}
                title="Share profile"
                aria-label="Share profile"
                aria-expanded={showShareMenu}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="btn-edit-profile"
                onClick={() => setShowShareMenu((prev) => !prev)}
                aria-expanded={showShareMenu}
                style={{ width: '100%' }}
              >
                Share Profile
              </button>
            )}

            {/* Share Popover Options */}
            {showShareMenu && (
              <div className="share-popover-menu" role="menu">
                <div className="share-popover-header">
                  <span className="share-popover-title">Share Profile</span>
                  {copied && <span className="share-copied-badge">Copied!</span>}
                </div>

                <div className="share-url-box">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="share-url-input"
                    onFocus={e => e.target.select()}
                  />
                  <button
                    type="button"
                    className="share-copy-btn"
                    onClick={handleCopyLink}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="share-options-list">
                  <button
                    type="button"
                    className="share-option-btn"
                    onClick={handleShareTwitter}
                  >
                    <span className="share-option-icon x-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </span>
                    <span>Share on X</span>
                  </button>

                  <button
                    type="button"
                    className="share-option-btn"
                    onClick={handleShareLinkedIn}
                  >
                    <span className="share-option-icon linkedin-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </span>
                    <span>Share on LinkedIn</span>
                  </button>

                  <button
                    type="button"
                    className="share-option-btn"
                    onClick={handleShareWhatsApp}
                  >
                    <span className="share-option-icon whatsapp-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </span>
                    <span>Share on WhatsApp</span>
                  </button>

                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      type="button"
                      className="share-option-btn"
                      onClick={handleNativeShare}
                    >
                      <span className="share-option-icon device-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </span>
                      <span>More options...</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Initial One-time Handle Setup (if not locked yet) */}
        {isMe && !activeUser?.is_username_set && (
          <div className="sidebar-handle-edit-wrap">
            {editingUsername ? (
              <form onSubmit={handleSaveUsername} className="sidebar-handle-form">
                <input
                  type="text"
                  autoFocus
                  maxLength={30}
                  value={newHandle}
                  onChange={e => setNewHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="sidebar-handle-input"
                  placeholder="Permanent handle..."
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="submit" disabled={savingHandle} className="btn-save-mini">
                    {savingHandle ? '...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditingUsername(false)} className="btn-cancel-mini">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNewHandle(activeUser?.username || '')
                  setEditingUsername(true)
                }}
                className="btn-change-handle-link"
              >
                Set permanent handle
              </button>
            )}
            {handleErr && <span className="handle-err-text">{handleErr}</span>}
          </div>
        )}

        {/* Links & Affiliations Section (ONLY if user added them) */}
        {hasAnyLinks && (
          <>
            <div className="sidebar-divider" />
            <ul className="sidebar-meta-list" aria-label="Competitor affiliations">
              {/* Location */}
              {location && (
                <li className="sidebar-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="meta-icon">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{location}</span>
                </li>
              )}

              {/* Website */}
              {website && (
                <li className="sidebar-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="meta-icon">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-link truncate"
                    title={websiteUrl}
                  >
                    {websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}

              {/* GitHub */}
              {rawGithub && (
                <li className="sidebar-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="meta-icon">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-link"
                  >
                    {githubHandle}
                  </a>
                </li>
              )}

              {/* LinkedIn */}
              {rawLinkedin && (
                <li className="sidebar-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="meta-icon">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-link"
                  >
                    {linkedinHandle}
                  </a>
                </li>
              )}
            </ul>
          </>
        )}

        {/* LeetCode-style Skills Section (integrated into main card with divider line) */}
        <ProfileSkillsCard topicFreq={topicFreq} matches={matches} eloHistory={eloHistory} />
      </div>
    </aside>
  )
}
