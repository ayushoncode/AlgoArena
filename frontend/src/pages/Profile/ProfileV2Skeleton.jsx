import React from 'react'

export default function ProfileV2Skeleton() {
  return (
    <div className="profile-v2" aria-busy="true" aria-label="Loading profile">
      <div className="profile-v2-container">
        <div className="profile-leetcode-layout">
          {/* Left Column: Sidebar Skeleton */}
          <aside className="profile-leetcode-sidebar">
            {/* User Info Card Skeleton */}
            <div className="sidebar-user-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="profile-v2-skeleton-box" style={{ width: 80, height: 80, borderRadius: 12 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div className="profile-v2-skeleton-box" style={{ width: 130, height: 20 }} />
                  <div className="profile-v2-skeleton-box" style={{ width: 90, height: 14 }} />
                  <div className="profile-v2-skeleton-box" style={{ width: 65, height: 18, borderRadius: 12 }} />
                </div>
              </div>

              <div className="profile-v2-skeleton-box" style={{ width: '100%', height: 36, borderRadius: 6, marginTop: 4 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <div className="profile-v2-skeleton-box" style={{ width: '80%', height: 14 }} />
                <div className="profile-v2-skeleton-box" style={{ width: '60%', height: 14 }} />
                <div className="profile-v2-skeleton-box" style={{ width: '70%', height: 14 }} />
              </div>
            </div>

            {/* Skills Card Skeleton */}
            <div className="sidebar-skills-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="profile-v2-skeleton-box" style={{ width: 60, height: 18 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="profile-v2-skeleton-box" style={{ width: 85, height: 14 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div className="profile-v2-skeleton-box" style={{ width: 110, height: 26, borderRadius: 13 }} />
                  <div className="profile-v2-skeleton-box" style={{ width: 85, height: 26, borderRadius: 13 }} />
                </div>
                <div className="profile-v2-skeleton-box" style={{ width: 95, height: 14 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div className="profile-v2-skeleton-box" style={{ width: 95, height: 26, borderRadius: 13 }} />
                  <div className="profile-v2-skeleton-box" style={{ width: 75, height: 26, borderRadius: 13 }} />
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Main Content Skeleton */}
          <main className="profile-leetcode-main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Rating History Chart Skeleton */}
            <div className="profile-v2-skeleton-box" style={{ width: '100%', height: 320, borderRadius: 10 }} />

            {/* Key Numbers Stats Card Skeleton (Full width) */}
            <div className="profile-v2-skeleton-box" style={{ width: '100%', height: 156, borderRadius: 10 }} />

            {/* Annual Activity Heatmap Skeleton */}
            <div className="profile-v2-skeleton-box" style={{ width: '100%', height: 200, borderRadius: 10 }} />

            {/* Match History Table Skeleton */}
            <div className="profile-v2-skeleton-box" style={{ width: '100%', height: 260, borderRadius: 10 }} />
          </main>
        </div>
      </div>
    </div>
  )
}
