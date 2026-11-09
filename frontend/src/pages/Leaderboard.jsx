import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import { IconSearch, IconClose } from '../components/icons'
import SiteNav from '../components/home/SiteNav'
import AuthDialog from '../components/AuthDialog'
import LeaderboardSkeleton from './Leaderboard/LeaderboardSkeleton'
import PodiumPlinth from './Leaderboard/PodiumPlinth'
import PlayerRow from './Leaderboard/PlayerRow'
import { usePremiumBadges } from '../hooks/usePremiumBadges'
import './Leaderboard/Leaderboard.css'

/**
 * AlgoArena Editorial Leaderboard Page
 * Matches Homepage Design System (Sora Variable, JetBrains Mono, Tonal Navy, Precise Hairlines)
 */

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [players, setPlayers] = useState([])
  const playerUsernames = useMemo(() => players.map(p => p.username), [players])
  const playerIds = useMemo(() => players.map(p => p.id), [players])
  const premiumBadges = usePremiumBadges(playerUsernames, playerIds)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('global')
  const [userRowVisible, setUserRowVisible] = useState(true)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('otp')

  const handleOpenAuth = (mode = 'otp') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)
  const searchInputRef = useRef(null)
  const userRowRef = useRef(null)
  const tabButtonRef = useRef(null)

  // SEO & Document Metadata
  useEffect(() => {
    document.title = 'Leaderboard | AlgoArena'

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content = 'AlgoArena real-time rankings and leaderboard. Track top algorithmic duellists by Elo rating, match records, and division tiers.'

    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
    }
    ogTitle.content = 'Leaderboard | AlgoArena'

    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (!ogDesc) {
      ogDesc = document.createElement('meta')
      ogDesc.setAttribute('property', 'og:description')
      document.head.appendChild(ogDesc)
    }
    ogDesc.content = 'AlgoArena real-time rankings and leaderboard. Track top algorithmic duellists by Elo rating, match records, and division tiers.'
  }, [])

  // Fetch rankings from existing endpoint (GET /api/users/leaderboard or /api/friends/leaderboard)
  const fetchRankings = useCallback(async (isInitial = false, tab = activeTab) => {
    try {
      if (isInitial) setLoading(true)
      const endpoint = tab === 'friends' ? '/api/friends/leaderboard' : '/api/users/leaderboard'
      const res = await api.get(endpoint, {
        signal: abortControllerRef.current?.signal,
      })
      if (!isMountedRef.current) return

      const list = Array.isArray(res.data) ? res.data : (res.data?.players || [])
      setPlayers(list)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      if (!isMountedRef.current) return
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.message === 'canceled') return
      console.error('[Leaderboard fetch error]', err)
      setError('Unable to load current rankings. Please check connectivity.')
    } finally {
      if (isMountedRef.current && isInitial) {
        setLoading(false)
        setTimeout(() => {
          if (isMountedRef.current) setIsInitialMount(false)
        }, 800)
      }
    }
  }, [activeTab])

  // Initial load and 30-second interval auto-refresh
  useEffect(() => {
    isMountedRef.current = true
    const controller = new AbortController()
    abortControllerRef.current = controller

    fetchRankings(true)

    const intervalId = setInterval(() => {
      fetchRankings(false)
    }, 30000)

    return () => {
      isMountedRef.current = false
      clearInterval(intervalId)
      setTimeout(() => {
        if (!isMountedRef.current) {
          controller.abort()
        }
      }, 50)
    }
  }, [fetchRankings])

  // Track if current user row is visible on screen for sticky bottom bar
  useEffect(() => {
    if (!user || !userRowRef.current) {
      setUserRowVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setUserRowVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(userRowRef.current)
    return () => observer.disconnect()
  }, [user, players, searchQuery])

  // Filtered players based on search query (username or institute)
  // Strictly filter out unranked players (0 completed matches)
  const q = searchQuery.trim().toLowerCase()
  const rankedPlayers = useMemo(() => {
    const active = players.filter(p => ((p.wins ?? 0) + (p.losses ?? 0)) > 0)
    if (!q) return active
    return active.filter(p =>
      p.username?.toLowerCase().includes(q) ||
      (p.institute && p.institute.toLowerCase().includes(q))
    )
  }, [players, q])

  // Top 3 for Podium plinths (from overall ranked list when no search active)
  const top1 = !q ? rankedPlayers[0] : null
  const top2 = !q ? rankedPlayers[1] : null
  const top3 = !q ? rankedPlayers[2] : null

  // Table players: all ranked matching players
  const tablePlayers = rankedPlayers

  // Current user's index in overall rankings
  const myOverallIdx = useMemo(() => {
    if (!user) return -1
    return rankedPlayers.findIndex(p => p.username === user.username)
  }, [rankedPlayers, user])

  // Format timestamp in HH:MM:SS format
  const formattedTimestamp = useMemo(() => {
    if (!lastUpdated) return ''
    const pad = n => String(n).padStart(2, '0')
    const h = pad(lastUpdated.getHours())
    const m = pad(lastUpdated.getMinutes())
    const s = pad(lastUpdated.getSeconds())
    return `${h}:${m}:${s}`
  }, [lastUpdated])

  const handleClearSearch = () => {
    setSearchQuery('')
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleScrollToMyRow = () => {
    if (userRowRef.current) {
      userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Keyboard navigation for tab list
  const handleTabKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      tabButtonRef.current?.focus()
    }
  }

  return (
    <div className="lb-page-root">
      
      {/* Sticky Editorial Navigation (Guests / Unauthenticated only) */}
      {!isAuthenticated && <SiteNav onOpenAuth={handleOpenAuth} />}

      <main className="lb-main" id="main-content">
        
        {/* H1 BLOCK */}
        <section className="lb-header-block" aria-labelledby="leaderboard-heading">
          <div className="lb-header-primary">
            <div className="lb-overline">Rankings</div>
            <div className="lb-title-wrap">
              <h1 id="leaderboard-heading" className="lb-title">
                Leaderboard
              </h1>
            </div>
            <p className="lb-subtitle">
              Players ranked by Elo. Select a name to see their match history.
            </p>
          </div>

          <div className="lb-status-line" aria-label="Ranking sync status">
            {formattedTimestamp && (
              <span className="lb-status-timestamp">Updated {formattedTimestamp}</span>
            )}
            <span className="lb-status-refresh">Refreshes every 30 seconds</span>
          </div>
        </section>

        {/* CONTROLS BAR */}
        <section className="lb-controls-bar" aria-label="Leaderboard Controls">
          
          {/* Tabs Track (Left: only data-backed tabs stay) */}
          <div
            className="lb-tabs-track"
            role="tablist"
            aria-label="Ranking categories"
            onKeyDown={handleTabKeyDown}
          >
            <button
              ref={tabButtonRef}
              type="button"
              role="tab"
              id="tab-global"
              aria-selected={activeTab === 'global'}
              aria-controls="panel-rankings"
              tabIndex={0}
              className={`lb-tab-btn ${activeTab === 'global' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('global')
                fetchRankings(true, 'global')
              }}
            >
              Global
            </button>
            <button
              type="button"
              role="tab"
              id="tab-friends"
              aria-selected={activeTab === 'friends'}
              aria-controls="panel-rankings"
              tabIndex={0}
              className={`lb-tab-btn ${activeTab === 'friends' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('friends')
                fetchRankings(true, 'friends')
              }}
            >
              Friends
            </button>
            <div
              className="lb-tab-indicator"
              style={{
                width: activeTab === 'friends' ? '68px' : '64px',
                transform: activeTab === 'friends' ? 'translateX(76px)' : 'translateX(4px)',
                transition: 'all 0.15s ease'
              }}
              aria-hidden="true"
            />
          </div>

          {/* Right Controls: Result Count & Search Field */}
          <div className="lb-controls-right">
            
            <div className="lb-result-count" aria-live="polite" aria-atomic="true">
              {loading ? 'Syncing...' : `${rankedPlayers.length} players`}
            </div>

            <div className="lb-search-wrap">
              <label htmlFor="leaderboard-player-search" className="sr-only">
                Search players by username
              </label>
              <IconSearch size={15} className="lb-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                id="leaderboard-player-search"
                className="lb-search-input"
                placeholder="Search player or institute..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="lb-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear player search"
                >
                  <IconClose size={14} />
                </button>
              )}
            </div>

          </div>

        </section>

        {/* CONTENT STATES */}
        <div id="panel-rankings" role="tabpanel" aria-labelledby="tab-global">
          {error ? (
            <div className="lb-error-box" role="alert">
              <p className="lb-error-title">{error}</p>
              <button
                type="button"
                className="lb-retry-btn"
                onClick={() => fetchRankings(true)}
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <LeaderboardSkeleton />
          ) : rankedPlayers.length === 0 ? (
            <div className="lb-empty-box">
              <p className="lb-empty-title">
                {activeTab === 'friends'
                  ? (q ? 'No friends match that name.' : 'No friends found on the leaderboard yet.')
                  : 'No players match that name.'}
              </p>
              {q && (
                <button
                  type="button"
                  className="lb-clear-search-btn"
                  onClick={handleClearSearch}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* PODIUM PLINTHS (Top 3 on Global view when not searching) */}
              {!q && (
                <section className="lb-podium-stage" aria-label="Top 3 podium">
                  <PodiumPlinth
                    rank={2}
                    player={top2}
                    isInitialMount={isInitialMount}
                    isPremium={Boolean(top2 && (premiumBadges[top2.username?.toLowerCase()] || premiumBadges[top2.id]))}
                    onSelect={() => top2 && navigate(`/profile/${encodeURIComponent(top2.username)}`)}
                  />
                  <PodiumPlinth
                    rank={1}
                    player={top1}
                    isInitialMount={isInitialMount}
                    isPremium={Boolean(top1 && (premiumBadges[top1.username?.toLowerCase()] || premiumBadges[top1.id]))}
                    onSelect={() => top1 && navigate(`/profile/${encodeURIComponent(top1.username)}`)}
                  />
                  <PodiumPlinth
                    rank={3}
                    player={top3}
                    isInitialMount={isInitialMount}
                    isPremium={Boolean(top3 && (premiumBadges[top3.username?.toLowerCase()] || premiumBadges[top3.id]))}
                    onSelect={() => top3 && navigate(`/profile/${encodeURIComponent(top3.username)}`)}
                  />
                </section>
              )}

              {/* TABLE (Ranks 4 and below on desktop, all ranks on mobile, or search results) */}
              <div className="lb-table-wrap">
                <table className={`lb-table ${q ? 'is-search-active' : ''}`} aria-label="AlgoArena Player Rankings">
                  <caption className="sr-only">AlgoArena Global Rankings Leaderboard</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="col-rank">Rank</th>
                      <th scope="col" className="col-player">Player</th>
                      <th scope="col" className="col-rating">Rating</th>
                      <th scope="col" className="col-winrate">Win Rate</th>
                      <th scope="col" className="col-record">Record</th>
                      <th scope="col" className="col-tier">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablePlayers.map((player, idx) => {
                      const overallIdx = rankedPlayers.findIndex(p => p.username === player.username)
                      const actualRank = player.rank ? Number(player.rank) : (overallIdx >= 0 ? overallIdx + 1 : idx + 1)
                      const isMe = user?.username === player.username
                      const isPodium = !q && actualRank <= 3

                      return (
                        <PlayerRow
                          key={player.id || player.username}
                          player={player}
                          actualRank={actualRank}
                          isMe={isMe}
                          isPodium={isPodium}
                          isPremium={Boolean(premiumBadges[player.username?.toLowerCase()] || premiumBadges[player.id])}
                          rowRef={isMe ? userRowRef : null}
                          onSelect={() => navigate(`/profile/${encodeURIComponent(player.username)}`)}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* STICKY BOTTOM USER RANK BAR (When current user row is off screen) */}
        {user && myOverallIdx >= 0 && !userRowVisible && (
          <div
            className="lb-sticky-rank-bar"
            role="complementary"
            aria-label="Current player rank shortcut"
            onClick={handleScrollToMyRow}
          >
            <div className="lb-sticky-rank-content">
              <span>Your rank:</span>
              <span className="lb-gold-mono">#{myOverallIdx + 1}</span>
              <span>of {players.length}</span>
            </div>
          </div>
        )}

        {/* QUIET FOOT NOTE */}
        <footer className="lb-footnote">
          <div>
            Rating changes after every match using the Elo formula.
          </div>
          <div>
            <a href="/who-we-are" className="lb-footnote-link">
              Who We Are
            </a>
          </div>
        </footer>

      </main>

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />

    </div>
  )
}
