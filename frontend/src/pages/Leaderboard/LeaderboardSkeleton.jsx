import React from 'react'
import './Leaderboard.css'

export default function LeaderboardSkeleton() {
  return (
    <div className="lb-skeleton-container" aria-busy="true" aria-label="Loading rankings data">
      
      {/* 3D Podium Plinth Skeletons */}
      <div className="lb-podium-stage lb-skeleton-podium" aria-hidden="true">
        
        {/* Rank 2 (Left, Silver - 220px) */}
        <div className="lb-plinth-wrap plinth-rank-2">
          <div className="lb-plinth-card">
            <div className="lb-plinth-avatar-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-name-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-rating-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-meta-shimmer home-skeleton-shimmer" />
          </div>
          <div className="lb-plinth-pedestal plinth-pedestal-2">
            <span className="lb-plinth-num">2</span>
          </div>
        </div>

        {/* Rank 1 (Center, Gold - 260px) */}
        <div className="lb-plinth-wrap plinth-rank-1">
          <div className="lb-plinth-card">
            <div className="lb-plinth-avatar-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-name-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-rating-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-meta-shimmer home-skeleton-shimmer" />
          </div>
          <div className="lb-plinth-pedestal plinth-pedestal-1">
            <span className="lb-plinth-num">1</span>
          </div>
        </div>

        {/* Rank 3 (Right, Bronze - 180px) */}
        <div className="lb-plinth-wrap plinth-rank-3">
          <div className="lb-plinth-card">
            <div className="lb-plinth-avatar-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-name-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-rating-shimmer home-skeleton-shimmer" />
            <div className="lb-plinth-meta-shimmer home-skeleton-shimmer" />
          </div>
          <div className="lb-plinth-pedestal plinth-pedestal-3">
            <span className="lb-plinth-num">3</span>
          </div>
        </div>

      </div>

      {/* Table Skeleton */}
      <div className="lb-table-wrap" aria-hidden="true">
        <table className="lb-table">
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
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="lb-row lb-skeleton-row">
                <td className="col-rank">
                  <div className="home-skeleton-shimmer" style={{ width: '24px', height: '14px' }} />
                </td>
                <td className="col-player">
                  <div className="lb-player-cell">
                    <div className="home-skeleton-shimmer lb-avatar-shimmer" />
                    <div className="home-skeleton-shimmer" style={{ width: '110px', height: '15px' }} />
                  </div>
                </td>
                <td className="col-rating">
                  <div className="home-skeleton-shimmer ml-auto" style={{ width: '48px', height: '16px' }} />
                </td>
                <td className="col-winrate">
                  <div className="lb-winrate-cell">
                    <div className="home-skeleton-shimmer" style={{ width: '60px', height: '3px' }} />
                    <div className="home-skeleton-shimmer" style={{ width: '36px', height: '13px' }} />
                  </div>
                </td>
                <td className="col-record">
                  <div className="home-skeleton-shimmer" style={{ width: '68px', height: '13px' }} />
                </td>
                <td className="col-tier">
                  <div className="home-skeleton-shimmer" style={{ width: '84px', height: '18px' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
