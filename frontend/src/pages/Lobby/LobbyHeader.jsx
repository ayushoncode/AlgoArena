import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserAvatar } from '../../utils/avatar'
import { getEloTier } from '../../utils/tierHelper'
import { IconSearch, IconClose } from '../../components/icons'
import api from '../../utils/api'

export default function LobbyHeader({
  user,
  connected,
  live,
  desktopSearchRef,
}) {
  const navigate = useNavigate()
  const elo = user?.elo_rating ?? 1200
  const tier = getEloTier(elo)
  const TierMark = tier.Mark

  // Search logic (preserved identically)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDrop, setShowDrop] = useState(false)
  const wrapRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function onMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const handleSearchChange = (val) => {
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (val.trim().length < 1) {
      setSuggestions([])
      setShowDrop(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(val.trim())}`)
        setSuggestions(data || [])
        setShowDrop((data || []).length > 0)
      } catch {
        setSuggestions([])
        setShowDrop(false)
      }
    }, 200)
  }

  const handleSelectUser = (username) => {
    setShowDrop(false)
    setSuggestions([])
    setQuery('')
    navigate(`/profile/${encodeURIComponent(username)}`)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    handleSelectUser(q)
  }

  return (
    <header className="lobby-v2-header-block" aria-label="Lobby Header">
      {/* Left: Overline, H1, Subtitle */}
      <div className="lobby-v2-header-left">
        <div className="lobby-v2-overline">Play</div>
        <h1 className="lobby-v2-title">Find a match</h1>
        <p className="lobby-v2-subtitle">
          You and a rival get the same problem. The first full pass wins the rating points.
        </p>
      </div>

      {/* Right: Live System Stats & Player Search */}
      <div className="lobby-v2-header-right">
        {/* System Stats Card: Live Problems & Online Coders */}
        <div className="lobby-v2-stats-card" aria-label="System status">
          <div className="lobby-v2-stats-top-row">
            <span
              className={`lobby-v2-status-dot ${connected ? 'is-connected' : 'is-reconnecting'}`}
              aria-hidden="true"
            />
            <span className="lobby-v2-stats-num">
              {live?.loading && !live?.totalProblems ? '...' : (live?.totalProblems || 209)}
            </span>
            <span className="lobby-v2-stats-label">Problems</span>
          </div>

          <div className="lobby-v2-stats-bottom-row">
            <span className="lobby-v2-stats-online-num">
              {live?.loading ? '...' : (live?.players ?? 0)}
            </span>
            <span className="lobby-v2-stats-online-label">
              {connected
                ? (live?.players === 1 ? 'Coder Online' : 'Coders Online')
                : 'Reconnecting'}
            </span>
          </div>
        </div>

        {/* Search Player Field */}
        <div ref={wrapRef} className="lobby-v2-search-wrap">
          <form onSubmit={handleSearchSubmit}>
            <IconSearch size={13} className="lobby-v2-search-icon" aria-hidden="true" />
            <input
              ref={desktopSearchRef}
              type="text"
              className="lobby-v2-search-input"
              placeholder="Search player"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowDrop(true) }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowDrop(false)
                  desktopSearchRef?.current?.blur()
                }
              }}
              spellCheck={false}
              autoComplete="off"
              aria-label="Search player by username"
            />
            {query ? (
              <button
                type="button"
                className="lobby-v2-search-clear"
                onClick={() => {
                  setQuery('')
                  setSuggestions([])
                  desktopSearchRef?.current?.focus()
                }}
                aria-label="Clear player search"
              >
                <IconClose size={12} />
              </button>
            ) : (
              <span className="lobby-v2-search-keyhint" aria-hidden="true">/</span>
            )}
          </form>

          {showDrop && (
            <div className="lobby-v2-search-dropdown" role="listbox">
              {suggestions.map((s) => {
                const sTier = getEloTier(s.elo_rating ?? 1200)
                return (
                  <button
                    key={s.username}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="lobby-v2-search-item"
                    onClick={() => handleSelectUser(s.username)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserAvatar
                        username={s.username}
                        seed={s.avatar_seed}
                        style={s.avatar_style}
                        size={24}
                      />
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{s.username}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: sTier.color, fontWeight: 700 }}>
                      {s.elo_rating ?? 1200}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
