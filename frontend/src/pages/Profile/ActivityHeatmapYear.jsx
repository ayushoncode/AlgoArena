import React, { useState, useMemo } from 'react'

function toLocalDateKey(dt) {
  if (!dt) return null
  const d = new Date(dt)
  if (isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function ActivityHeatmapYear({
  matches = [],
  eloHistory = [],
  activeDates = new Set(),
  streak = 0,
}) {
  const [hoveredCell, setHoveredCell] = useState(null)
  const [selectedYear, setSelectedYear] = useState('current')

  // Aggregate matches strictly by local date YYYY-MM-DD from actual matches/duels
  const dateCounts = useMemo(() => {
    const map = new Map()

    // 1. Primary: Count all completed duel matches from eloHistory
    if (Array.isArray(eloHistory) && eloHistory.length > 0) {
      eloHistory.forEach(e => {
        const dt = e.date || e.created_at
        const k = toLocalDateKey(dt)
        if (k) {
          map.set(k, (map.get(k) || 0) + 1)
        }
      })
    }

    // 2. Also incorporate matches
    if (Array.isArray(matches) && matches.length > 0) {
      matches.forEach(m => {
        const dt = m.ended_at || m.started_at || m.date
        const k = toLocalDateKey(dt)
        if (k && !map.has(k)) {
          map.set(k, (map.get(k) || 0) + 1)
        }
      })
    }

    // 3. Incorporate activeDates fallback
    if (activeDates) {
      const datesIterable = activeDates instanceof Set ? activeDates : Array.isArray(activeDates) ? activeDates : []
      datesIterable.forEach(d => {
        const k = typeof d === 'string' && d.length === 10 ? d : toLocalDateKey(d)
        if (k && !map.has(k)) {
          map.set(k, 1)
        }
      })
    }

    return map
  }, [eloHistory, matches, activeDates])

  // Build 12-month calendar grouped with month spacing (LeetCode style)
  const { months, totalSubmissions, activeDaysCount, maxStreak } = useMemo(() => {
    const today = new Date()
    const todayDateStr = toLocalDateKey(today)
    let totalSubs = 0
    let activeDays = 0

    const monthList = []

    // 12 months ending with the current month
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const monthName = d.toLocaleDateString('en-US', { month: 'short' })
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sun

      const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth())

      const weeks = []
      let currentWeek = []

      // Leading empty placeholders in week 0
      for (let r = 0; r < firstDayOfWeek; r++) {
        currentWeek.push({ isEmpty: true })
      }

      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const isFuture = isCurrentMonth && dayNum > today.getDate()
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        const count = isFuture ? 0 : (dateCounts.get(dateStr) || 0)
        const dateObj = new Date(year, month, dayNum)

        if (!isFuture && count > 0) {
          totalSubs += count
          activeDays++
        }

        currentWeek.push({
          isEmpty: false,
          isFuture,
          dayNum,
          date: dateStr,
          count,
          dayOfWeek: dateObj.getDay(),
          isToday: dateStr === todayDateStr,
          formatted: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        })

        if (currentWeek.length === 7) {
          weeks.push(currentWeek)
          currentWeek = []
        }
      }

      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push({ isEmpty: true })
        }
        weeks.push(currentWeek)
      }

      monthList.push({
        name: monthName,
        year,
        month,
        weeks,
      })
    }

    // Calculate max streak across all chronological days
    let maxS = 0
    let curS = 0
    monthList.forEach(m => {
      m.weeks.forEach(w => {
        w.forEach(cell => {
          if (!cell.isEmpty && !cell.isFuture) {
            if (cell.count > 0) {
              curS++
              if (curS > maxS) maxS = curS
            } else {
              curS = 0
            }
          }
        })
      })
    })

    return {
      months: monthList,
      totalSubmissions: totalSubs,
      activeDaysCount: activeDays,
      maxStreak: Math.max(maxS, streak || 0),
    }
  }, [dateCounts, streak])

  // Get vibrant green color palette matching LeetCode
  const getCellColor = (count) => {
    if (count <= 0) return '#23272f' // clean subtle dark slate, no border
    if (count === 1) return '#0e4429' // dark green
    if (count <= 4) return '#006d32' // emerald
    if (count <= 9) return '#26a641' // bright green
    return '#39d353' // vibrant neon green
  }

  return (
    <div className="profile-big-heatmap-card" role="region" aria-label="Annual activity heatmap">
      {/* 1. Header Bar */}
      <div className="big-heatmap-header">
        <div className="heatmap-header-left">
          <span className="heatmap-headline-count">
            {totalSubmissions}
          </span>
          <span className="heatmap-headline-text">
            submissions in the past one year
          </span>
          <span className="heatmap-info-icon" title="Submissions and competitive duels recorded in AlgoArena" aria-hidden="true">
            ⓘ
          </span>
        </div>

        <div className="heatmap-header-right">
          <div className="heatmap-meta-stat">
            <span className="meta-stat-label">Total active days:</span>
            <span className="meta-stat-value">{activeDaysCount}</span>
          </div>

          <div className="heatmap-meta-stat">
            <span className="meta-stat-label">Max streak:</span>
            <span className="meta-stat-value">{maxStreak}</span>
          </div>

          <div className="heatmap-year-select-wrap">
            <button
              type="button"
              className="heatmap-year-btn"
              onClick={() => setSelectedYear(selectedYear === 'current' ? 'all' : 'current')}
            >
              <span>{selectedYear === 'current' ? 'Current' : 'All time'}</span>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 4.5 L6 7.5 L9 4.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Month-by-Month Grouped Matrix Grid with Spacing */}
      <div className="big-heatmap-scroll-area">
        <div className="big-heatmap-content">
          <div className="big-heatmap-months-strip">
            {months.map(m => (
              <div key={`${m.name}-${m.year}`} className="heatmap-month-block">
                <div className="heatmap-month-grid">
                  {m.weeks.map((week, wIdx) => (
                    <div key={`w-${wIdx}`} className="heatmap-week-column">
                      {week.map((cell, rIdx) => {
                        if (cell.isEmpty || cell.isFuture) {
                          return (
                            <div
                              key={`empty-${rIdx}`}
                              className="heatmap-day-cell is-empty"
                              aria-hidden="true"
                            />
                          )
                        }

                        const bg = getCellColor(cell.count)
                        const isHovered = hoveredCell?.date === cell.date

                        return (
                          <div
                            key={cell.date}
                            className={`heatmap-day-cell ${cell.isToday ? 'is-today-cell' : ''} ${isHovered ? 'is-hovered' : ''}`}
                            style={{ backgroundColor: bg }}
                            tabIndex={0}
                            role="gridcell"
                            aria-label={`${cell.formatted}: ${cell.count} ${cell.count === 1 ? 'match' : 'matches'}`}
                            onMouseEnter={() => setHoveredCell(cell)}
                            onMouseLeave={() => setHoveredCell(null)}
                            onFocus={() => setHoveredCell(cell)}
                            onBlur={() => setHoveredCell(null)}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="heatmap-month-caption">
                  <span className="heatmap-month-text">{m.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Floating Tooltip */}
          {hoveredCell && (
            <div className="big-heatmap-tooltip" role="status" aria-live="polite">
              <span className="tooltip-date">{hoveredCell.formatted}</span>
              <span className="tooltip-sep">•</span>
              <span className="tooltip-matches">
                {hoveredCell.count === 0 ? 'No submissions' : `${hoveredCell.count} ${hoveredCell.count === 1 ? 'submission' : 'submissions'}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
