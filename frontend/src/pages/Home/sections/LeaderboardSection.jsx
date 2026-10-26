import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HOME_CONFIG } from '../../../content/home'
import api from '../../../utils/api'
import DepthSection from '../../../components/home/DepthSection'
import './sections.css'

const { s6HallOfHeroes } = HOME_CONFIG

// Helper to determine rank tier based on Elo
function getEloTier(elo) {
  if (elo >= 2000) return { code: 'GM', name: 'Grandmaster', color: '#f97316' }
  if (elo >= 1800) return { code: 'CM', name: 'Candidate Master', color: '#a855f7' }
  if (elo >= 1600) return { code: 'EXP', name: 'Expert', color: '#3b82f6' }
  if (elo >= 1400) return { code: 'SPEC', name: 'Specialist', color: '#06b6d4' }
  if (elo >= 1200) return { code: 'APP', name: 'Apprentice', color: '#10b981' }
  return { code: 'NOV', name: 'Novice', color: '#9ca3af' }
}

// Fallback seed data in case API is unreachable
const FALLBACK_LEADERS = [
  { rank: '1', username: 'letsjoyn', elo_rating: 1238, wins: 2, losses: 0, institute: 'Ramaiah Institute of Technology' },
  { rank: '2', username: 'champion', elo_rating: 1229, wins: 5, losses: 3, institute: 'Msrit' },
  { rank: '3', username: 'serie', elo_rating: 1223, wins: 1, losses: 0, institute: 'Ramaiah Institute of Technology' },
  { rank: '4', username: 'ayushoncode', elo_rating: 1220, wins: 63, losses: 60, institute: 'Ramaiah Institute of Technology' },
  { rank: '5', username: 'prakashdeep', elo_rating: 1200, wins: 0, losses: 0, institute: 'IIT Mandi' },
]

function IconArrowRight({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M2.5 8H13.5M9.5 4L13.5 8L9.5 12" />
    </svg>
  )
}

export default function LeaderboardSection() {
  const [leaders, setLeaders] = useState(FALLBACK_LEADERS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadLeaderboard() {
      try {
        const { data } = await api.get('/api/users/leaderboard')
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setLeaders(data.slice(0, 5))
        }
      } catch {
        // Retain fallback data on network failure
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadLeaderboard()
    return () => { isMounted = false }
  }, [])

  return (
    <section className="home-section surface-bg-1" id="leaderboard-preview">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      <DepthSection id="s6-leaderboard" enter={true} exit={true}>
        <div className="section-container">
          
          {/* Editorial Section Header */}
          <div className="section-header depth-heading-layer">
            <span className="section-kicker">{s6HallOfHeroes.kicker}</span>
            <h2 className="section-title">{s6HallOfHeroes.title}</h2>
            <p className="section-body">{s6HallOfHeroes.body}</p>
          </div>

          {/* Leaderboard Table Container */}
          <div className="leaderboard-table-card depth-visual-panel anim-enter">
            <div className="table-responsive-wrap">
              <table className="leaderboard-table" aria-label="Top Arena Coders Leaderboard">
                <thead>
                  <tr>
                    <th scope="col" className="th-rank">Rank</th>
                    <th scope="col" className="th-coder">Coder</th>
                    <th scope="col" className="th-rating">Rating</th>
                    <th scope="col" className="th-record">Record</th>
                    <th scope="col" className="th-winrate">Win Rate</th>
                    <th scope="col" className="th-tier">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((player, idx) => {
                    const rankNum = idx + 1
                    const totalMatches = (player.wins ?? 0) + (player.losses ?? 0)
                    const winRate = totalMatches > 0 ? Math.round(((player.wins ?? 0) / totalMatches) * 100) : 0
                    const tier = getEloTier(player.elo_rating)
                    const initials = player.username ? player.username.slice(0, 2).toUpperCase() : '??'

                    return (
                      <tr key={player.id || player.username || idx} className={`leader-row row-rank-${rankNum} stagger-row`}>
                        {/* Rank */}
                        <td className="td-rank">
                          <span className={`rank-badge-num rank-${rankNum}`}>
                            #{rankNum}
                          </span>
                        </td>

                        {/* Coder Info */}
                        <td className="td-coder">
                          <div className="coder-profile-cell">
                            <div className="coder-avatar-initials" aria-hidden="true" style={{ borderColor: tier.color }}>
                              <span>{initials}</span>
                            </div>
                            <div className="coder-meta-box">
                              <span className="coder-username">{player.username}</span>
                              {player.institute && (
                                <span className="coder-institute" title={player.institute}>
                                  {player.institute}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Elo Rating */}
                        <td className="td-rating">
                          <span className="rating-mono-num" style={{ color: tier.color }}>
                            {player.elo_rating}
                          </span>
                        </td>

                        {/* Match Record */}
                        <td className="td-record">
                          <span className="record-wins">{player.wins ?? 0}W</span>
                          <span className="record-sep"> / </span>
                          <span className="record-losses">{player.losses ?? 0}L</span>
                        </td>

                        {/* Win Rate */}
                        <td className="td-winrate">
                          <span className="winrate-pct">{winRate}%</span>
                        </td>

                        {/* Division Tier Badge */}
                        <td className="td-tier">
                          <span className="tier-tag-pill" style={{ color: tier.color, borderColor: `${tier.color}44`, backgroundColor: `${tier.color}15` }}>
                            {tier.code}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Link */}
            <div className="leaderboard-table-footer">
              <span className="footer-status-hint">
                {loading ? 'Refreshing standings...' : 'Verified rankings updated after every settled match.'}
              </span>
              <Link to="/leaderboard" className="leaderboard-view-all-link">
                <span>{s6HallOfHeroes.fullLinkText}</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </DepthSection>
    </section>
  )
}
