import React, { useState, useMemo } from 'react'

export default function ActivityCalendarV2({
  activeDates = new Set(),
  matches = [],
  streak = 0,
}) {
  const [hoveredDay, setHoveredDay] = useState(null)

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Aggregate match count per date (YYYY-MM-DD)
  const dateCounts = useMemo(() => {
    const map = new Map()

    if (activeDates instanceof Set) {
      activeDates.forEach(d => {
        if (typeof d === 'string') {
          map.set(d.slice(0, 10), 1)
        }
      })
    } else if (Array.isArray(activeDates)) {
      activeDates.forEach(d => {
        const k = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
        map.set(k, (map.get(k) || 0) + 1)
      })
    }

    if (Array.isArray(matches)) {
      matches.forEach(m => {
        const dt = m.ended_at || m.started_at || m.date
        if (dt) {
          try {
            const k = new Date(dt).toISOString().slice(0, 10)
            map.set(k, (map.get(k) || 0) + 1)
          } catch {
            // ignore invalid date
          }
        }
      })
    }

    return map
  }, [activeDates, matches])

  // Generate 30 days sequence up to today
  const { days, activeCount, monthHints } = useMemo(() => {
    const list = []
    let active = 0
    const months = new Set()

    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = dateCounts.get(dateStr) || 0
      if (count > 0) active++

      const monthName = d.toLocaleDateString('en-US', { month: 'short' })
      months.add(monthName)

      list.push({
        date: dateStr,
        count,
        isToday: dateStr === todayStr,
        formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
      })
    }

    return {
      days: list,
      activeCount: active,
      monthHints: Array.from(months).join(' / '),
    }
  }, [dateCounts, todayStr])

  // Opacity levels: 6%, 25%, 45%, 65%, 85%
  const getCellOpacity = (count) => {
    if (count <= 0) return 0.06
    if (count === 1) return 0.25
    if (count === 2) return 0.45
    if (count === 3) return 0.65
    return 0.85
  }

  return (
    <div className="profile-activity-card">
      {/* 1. Section Header */}
      <div className="section-heading-row" style={{ borderBottom: 'none', padding: 0, margin: 0, marginBottom: 14 }}>
        <h3 className="section-title">Activity</h3>
        <span className="profile-activity-meta">
          {monthHints} • Last 30 days
        </span>
      </div>

      {/* 2. Calendar Grid with Weekday Hints */}
      <div className="profile-activity-grid-wrap" role="region" aria-label="30-day activity calendar">
        <div className="profile-activity-grid">
          {days.map((day) => {
            const opacity = getCellOpacity(day.count)
            const isHovered = hoveredDay?.date === day.date

            return (
              <div
                key={day.date}
                className={`profile-activity-cell ${day.isToday ? 'is-today' : ''} ${isHovered ? 'is-hovered' : ''}`}
                style={{
                  backgroundColor: `rgba(240, 246, 252, ${opacity})`,
                }}
                tabIndex={0}
                role="gridcell"
                aria-label={`${day.formatted}: ${day.count} ${day.count === 1 ? 'match' : 'matches'}`}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                onFocus={() => setHoveredDay(day)}
                onBlur={() => setHoveredDay(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setHoveredDay(null)
                }}
              />
            )
          })}
        </div>

        {/* 3. Floating Tooltip */}
        {hoveredDay && (
          <div className="profile-activity-tooltip" role="status" aria-live="polite">
            <span className="activity-tooltip-date">{hoveredDay.formatted}</span>
            <span className="activity-tooltip-sep" aria-hidden="true">•</span>
            <span className="activity-tooltip-count">
              {hoveredDay.count === 0 ? 'No matches' : `${hoveredDay.count} ${hoveredDay.count === 1 ? 'match' : 'matches'}`}
            </span>
          </div>
        )}
      </div>

      {/* 4. Subline Plain Text (Honest numbers, no repeated streak) */}
      <div className="profile-activity-foot">
        <span className="profile-activity-foot-text">
          Active {activeCount} of the last 30 days
        </span>
        <div className="profile-activity-legend" aria-hidden="true">
          <span className="legend-label">Less</span>
          <div className="legend-swatch" style={{ backgroundColor: 'rgba(240, 246, 252, 0.06)' }} />
          <div className="legend-swatch" style={{ backgroundColor: 'rgba(240, 246, 252, 0.25)' }} />
          <div className="legend-swatch" style={{ backgroundColor: 'rgba(240, 246, 252, 0.45)' }} />
          <div className="legend-swatch" style={{ backgroundColor: 'rgba(240, 246, 252, 0.65)' }} />
          <div className="legend-swatch" style={{ backgroundColor: 'rgba(240, 246, 252, 0.85)' }} />
          <span className="legend-label">More</span>
        </div>
      </div>
    </div>
  )
}
