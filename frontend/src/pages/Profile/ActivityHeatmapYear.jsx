import React, { useState, useMemo } from 'react'

export default function ActivityHeatmapYear({
  matches = [],
  activeDates = new Set(),
  streak = 0,
}) {
  const [hoveredCell, setHoveredCell] = useState(null)
  const [selectedYear, setSelectedYear] = useState('current')

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Aggregate matches by date YYYY-MM-DD
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
            // ignore
          }
        }
      })
    }

    return map
  }, [activeDates, matches])

  // Build 52-week calendar grid (past 364 days ending today)
  const { weeks, monthLabels, totalSubmissions, activeDaysCount, maxStreak } = useMemo(() => {
    const today = new Date()
    // Align today's day of week (0 = Sun, 6 = Sat)
    const todayDayOfWeek = today.getDay()
    
    // We want 52 full weeks (364 days) + remaining days up to today
    const totalDays = 52 * 7 + (todayDayOfWeek + 1)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (totalDays - 1))

    const allDays = []
    let submissions = 0
    let activeDays = 0

    const curr = new Date(startDate)
    for (let i = 0; i < totalDays; i++) {
      const dateStr = curr.toISOString().slice(0, 10)
      const count = dateCounts.get(dateStr) || 0
      if (count > 0) {
        submissions += count
        activeDays++
      }

      allDays.push({
        date: dateStr,
        count,
        isToday: dateStr === todayStr,
        dayOfWeek: curr.getDay(),
        month: curr.getMonth(),
        year: curr.getFullYear(),
        formatted: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      })

      curr.setDate(curr.getDate() + 1)
    }

    // Compute max streak across all days
    let maxS = 0
    let currentS = 0
    allDays.forEach(d => {
      if (d.count > 0) {
        currentS++
        if (currentS > maxS) maxS = currentS
      } else {
        currentS = 0
      }
    })
    maxS = Math.max(maxS, streak || 0)

    // Group allDays into columns of weeks (7 days per week)
    const weekCols = []
    let currentWeek = []

    allDays.forEach(d => {
      currentWeek.push(d)
      if (currentWeek.length === 7) {
        weekCols.push(currentWeek)
        currentWeek = []
      }
    })
    if (currentWeek.length > 0) {
      weekCols.push(currentWeek)
    }

    // Determine month label positions across week columns
    const months = []
    let lastMonth = -1

    weekCols.forEach((col, colIdx) => {
      // Look at the middle day of the week
      const midDay = col[Math.floor(col.length / 2)] || col[0]
      if (midDay && midDay.month !== lastMonth) {
        lastMonth = midDay.month
        const monthName = new Date(midDay.year, midDay.month, 1).toLocaleDateString('en-US', { month: 'short' })
        months.push({ colIndex: colIdx, name: monthName })
      }
    })

    return {
      weeks: weekCols,
      monthLabels: months,
      totalSubmissions: submissions,
      activeDaysCount: activeDays,
      maxStreak: maxS,
    }
  }, [dateCounts, todayStr, streak])

  // Get vibrant green color palette matching LeetCode / Screenshot 1
  const getCellColor = (count) => {
    if (count <= 0) return '#1b222c' // dark slate
    if (count === 1) return '#0e4429' // dark green
    if (count === 2) return '#006d32' // medium emerald
    if (count === 3) return '#26a641' // bright green
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

      {/* 2. Heatmap Matrix Grid with Tooltip */}
      <div className="big-heatmap-scroll-area">
        <div className="big-heatmap-content">
          <div className="big-heatmap-grid">
            {weeks.map((week, wIdx) => (
              <div key={`w-${wIdx}`} className="heatmap-week-column">
                {week.map(day => {
                  const bg = getCellColor(day.count)
                  const isHovered = hoveredCell?.date === day.date

                  return (
                    <div
                      key={day.date}
                      className={`heatmap-day-cell ${day.isToday ? 'is-today-cell' : ''} ${isHovered ? 'is-hovered' : ''}`}
                      style={{ backgroundColor: bg }}
                      tabIndex={0}
                      role="gridcell"
                      aria-label={`${day.formatted}: ${day.count} matches`}
                      onMouseEnter={() => setHoveredCell(day)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onFocus={() => setHoveredCell(day)}
                      onBlur={() => setHoveredCell(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Month labels under corresponding columns */}
          <div className="big-heatmap-months">
            {monthLabels.map(m => (
              <span
                key={`${m.name}-${m.colIndex}`}
                className="heatmap-month-label"
                style={{
                  gridColumnStart: m.colIndex + 1,
                }}
              >
                {m.name}
              </span>
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
