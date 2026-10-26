import React, { useMemo } from 'react'

export default function FootNoteV2({ lastUpdated }) {
  const updatedTime = useMemo(() => {
    if (lastUpdated) {
      try {
        const d = new Date(lastUpdated)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      } catch {
        // fallback
      }
    }
    const now = new Date()
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }, [lastUpdated])

  return (
    <footer className="profile-trust-footnote">
      <div className="profile-footnote-inner">
        <span className="profile-footnote-text">
          Ratings update after every match using the{' '}
          <a href="/#ratings" className="profile-footnote-link">
            Elo formula
          </a>
          .
        </span>
        <span className="profile-footnote-time">
          Updated {updatedTime}
        </span>
      </div>
    </footer>
  )
}
