import React from 'react'

export default function ProfileV2Skeleton() {
  return (
    <div className="profile-v2">
      <div className="profile-v2-container">
        {/* Header Skeleton */}
        <div className="profile-header" style={{ minHeight: 132 }}>
          <div className="header-left">
            <div className="profile-v2-skeleton-box" style={{ width: 76, height: 76, borderRadius: 4 }} />
            <div className="header-identity" style={{ gap: 12 }}>
              <div className="profile-v2-skeleton-box" style={{ width: 220, height: 32 }} />
              <div className="profile-v2-skeleton-box" style={{ width: 180, height: 16 }} />
            </div>
          </div>
          <div className="header-right">
            <div className="profile-v2-skeleton-box" style={{ width: 110, height: 40 }} />
            <div className="profile-v2-skeleton-box" style={{ width: 170, height: 14 }} />
            <div className="profile-v2-skeleton-box" style={{ width: 220, height: 6 }} />
          </div>
        </div>

        {/* Key Numbers Ruled Row Skeleton */}
        <div className="profile-key-numbers">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="key-number-cell" style={{ gap: 12 }}>
              <div className="profile-v2-skeleton-box" style={{ width: 60, height: 12 }} />
              <div className="profile-v2-skeleton-box" style={{ width: 80, height: 22 }} />
            </div>
          ))}
        </div>

        {/* Chart Section Skeleton */}
        <div className="profile-v2-skeleton-box" style={{ width: '100%', height: 320, borderRadius: 4 }} />

        {/* Bottom Dual Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <div className="profile-v2-skeleton-box" style={{ height: 380, borderRadius: 4 }} />
          <div className="profile-v2-skeleton-box" style={{ height: 380, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )
}
