import { useState } from 'react'
import { getUserAvatarUrl } from '../../utils/avatar'

/**
 * AvatarButton — 32px round avatar control for the AlgoArena navbar
 * Hairline ring on focus, zero chevron, aria-compliant.
 */
export default function AvatarButton({ id = 'nav-user-btn', user, isOpen, onClick, buttonRef }) {
  const [imgErr, setImgErr] = useState(false)
  const username = user?.username || 'coder'
  const avatarUrl = getUserAvatarUrl(username, user?.avatar_seed, user?.avatar_style)
  const fallbackInitial = (username[0] || 'U').toUpperCase()

  return (
    <button
      ref={buttonRef}
      id={id}
      type="button"
      onClick={onClick}
      className={`nav-v2-avatar-btn ${isOpen ? 'is-open' : ''}`}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label="Account menu"
    >
      {!imgErr && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="nav-v2-avatar-img"
          onError={() => setImgErr(true)}
        />
      ) : (
        <span className="nav-v2-avatar-fallback">{fallbackInitial}</span>
      )}
    </button>
  )
}
