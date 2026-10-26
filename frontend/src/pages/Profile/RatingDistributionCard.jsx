import React, { useMemo } from 'react'
import { getTierForRating, getTierProgress, CANONICAL_TIERS } from '../../lib/tiers'

export default function RatingDistributionCard({
  elo = 1200,
  totalMatches = 0,
}) {
  const tier = getTierForRating(elo)
  const progress = getTierProgress(elo, totalMatches)

  // Compute percentile based on Elo rating (1200 is median ~50%, 1600 is top 15%, 2000 is top 1%)
  const percentile = useMemo(() => {
    const r = Number(elo) || 1200
    if (r >= 2000) return '0.85%'
    if (r >= 1800) return '3.2%'
    if (r >= 1600) return '8.5%'
    if (r >= 1400) return '15.63%'
    if (r >= 1250) return '24.1%'
    if (r >= 1200) return '38.5%'
    return '52.0%'
  }, [elo])

  // Simulated 20-bucket histogram distribution across rating tiers
  // Highlighting the bucket containing user's rating in amber/gold (like LeetCode screenshot!)
  const distributionBars = useMemo(() => {
    // Normal distribution heights peaking around 1200-1300
    const heights = [12, 18, 28, 45, 68, 92, 100, 85, 64, 48, 36, 26, 18, 12, 8, 6, 4, 3, 2, 2]
    const userBucketIdx = Math.min(
      heights.length - 1,
      Math.max(0, Math.floor(((Number(elo) || 1200) - 900) / 60))
    )

    return heights.map((h, i) => ({
      heightPct: h,
      isUserBucket: i === userBucketIdx,
    }))
  }, [elo])

  return (
    <div className="profile-distribution-card">
      <div className="distribution-header">
        <span className="distribution-top-label">Top</span>
        <span className="distribution-percentile">{percentile}</span>
      </div>

      {/* Distribution Histogram Bars (LeetCode Style) */}
      <div className="distribution-histogram-wrap" aria-label="Global rating distribution">
        <div className="distribution-bars">
          {distributionBars.map((b, idx) => (
            <div
              key={`bar-${idx}`}
              className={`distribution-bar ${b.isUserBucket ? 'is-user-rating' : ''}`}
              style={{
                height: `${b.heightPct}%`,
                backgroundColor: b.isUserBucket ? '#f59e0b' : 'rgba(148, 163, 184, 0.2)',
              }}
              title={b.isUserBucket ? `Your rating: ${elo} ELO` : undefined}
            />
          ))}
        </div>
      </div>

      {/* Tier Progress Bar under Histogram */}
      <div className="distribution-progress-footer">
        <div className="distribution-tier-row">
          <span className="distribution-tier-name" style={{ color: tier.color }}>
            {tier.name}
          </span>
          <span className="distribution-needed-text">
            {progress.label}
          </span>
        </div>
        <div className="distribution-track">
          <div
            className="distribution-fill"
            style={{
              width: `${progress.pct}%`,
              backgroundColor: tier.color,
            }}
          />
        </div>
      </div>
    </div>
  )
}
