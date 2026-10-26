import React, { useState, useMemo, useRef, useEffect } from 'react'
import { CANONICAL_TIERS, getTierForRating } from '../../lib/tiers'

const VIEW_W = 800
const VIEW_H = 270
const PADDING = { top: 28, right: 90, bottom: 38, left: 52 }

export default function RatingChartV2({
  data = [],
  elo = 1200,
  isOwnProfile = true,
  onNavigateLobby,
}) {
  const [range, setRange] = useState('all') // 'last20' | '30d' | 'all'
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(null)
  const [showTable, setShowTable] = useState(false)
  const [svgWidth, setSvgWidth] = useState(VIEW_W)
  const chartRef = useRef(null)

  // Measure container width for responsive x-axis ticks
  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setSvgWidth(entry.contentRect.width)
        }
      }
    })
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [])

  // 1. Sort & sanitize raw data defensively without mutating props
  const sortedRaw = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []
    return [...data].sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0
      const tb = b.date ? new Date(b.date).getTime() : 0
      return ta - tb
    })
  }, [data])

  // 2. Filter data client-side based on range choice (in memory only, 0 network calls)
  const filteredData = useMemo(() => {
    if (sortedRaw.length === 0) return []
    if (range === 'last20') {
      return sortedRaw.slice(-20)
    }
    if (range === '30d') {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      const subset = sortedRaw.filter(d => d.date && new Date(d.date).getTime() >= thirtyDaysAgo)
      // If fewer than 2 points fall in last 30d, show at least last 2 points if available
      return subset.length >= 2 ? subset : sortedRaw.slice(-Math.min(2, sortedRaw.length))
    }
    return sortedRaw
  }, [sortedRaw, range])

  // 3. Ensure last point reflects current rating if available
  const pointsData = useMemo(() => {
    if (filteredData.length === 0) return []
    if (filteredData.length === 1) return filteredData
    const copy = [...filteredData]
    copy[copy.length - 1] = {
      ...copy[copy.length - 1],
      rating: Number(elo) || Number(copy[copy.length - 1].rating) || 1200,
    }
    return copy
  }, [filteredData, elo])

  // 4. Downsampling for rendering if points > 400 (keeps first, peak, min, last)
  const renderPoints = useMemo(() => {
    if (pointsData.length <= 400) return pointsData
    const total = pointsData.length
    const step = Math.ceil(total / 380)
    let peakIdx = 0
    let minIdx = 0
    let maxR = -Infinity
    let minR = Infinity

    pointsData.forEach((d, idx) => {
      const r = Number(d.rating) || 1200
      if (r > maxR) { maxR = r; peakIdx = idx }
      if (r < minR) { minR = r; minIdx = idx }
    })

    const selected = new Set([0, peakIdx, minIdx, total - 1])
    for (let i = 0; i < total; i += step) {
      selected.add(i)
    }

    return Array.from(selected)
      .sort((a, b) => a - b)
      .map(i => pointsData[i])
  }, [pointsData])

  // 5. Y-Range calculation with automatic padding so line never touches edges
  const { yMin, yMax, yRange, yTicks, visibleTiers, peakRating, peakIdx, currentRating } = useMemo(() => {
    if (pointsData.length === 0) {
      return { yMin: 1000, yMax: 1400, yRange: 400, yTicks: [1000, 1200, 1400], visibleTiers: [], peakRating: 1200, peakIdx: 0, currentRating: 1200 }
    }

    const ratings = pointsData.map(d => Number(d.rating) || 1200)
    let maxVal = -Infinity
    let minVal = Infinity
    let pIdx = 0

    ratings.forEach((r, i) => {
      if (r > maxVal) { maxVal = r; pIdx = i }
      if (r < minVal) { minVal = r }
    })

    const spread = maxVal - minVal
    const step = spread > 350 ? 100 : 50
    const pad = Math.max(30, Math.ceil(spread * 0.15))
    const calculatedMin = Math.max(0, Math.floor((minVal - pad) / step) * step)
    const calculatedMax = Math.max(calculatedMin + step * 3, Math.ceil((maxVal + pad) / step) * step)
    const rangeVal = calculatedMax - calculatedMin || 1

    const ticks = []
    for (let r = calculatedMin; r <= calculatedMax; r += step) {
      ticks.push(r)
    }

    // Visible tier bands falling inside [calculatedMin, calculatedMax]
    const tiers = CANONICAL_TIERS.filter(t => {
      const tMax = t.max !== null ? t.max : 9999
      return t.min <= calculatedMax && tMax >= calculatedMin
    })

    return {
      yMin: calculatedMin,
      yMax: calculatedMax,
      yRange: rangeVal,
      yTicks: ticks,
      visibleTiers: tiers,
      peakRating: maxVal,
      peakIdx: pIdx,
      currentRating: ratings[ratings.length - 1],
    }
  }, [pointsData])

  const currentTier = useMemo(() => getTierForRating(currentRating), [currentRating])
  const peakTier = useMemo(() => getTierForRating(peakRating), [peakRating])

  // Plot geometry
  const plotW = VIEW_W - PADDING.left - PADDING.right
  const plotH = VIEW_H - PADDING.top - PADDING.bottom

  const xScale = (idx, total) => {
    if (total <= 1) return plotW / 2
    return (idx / (total - 1)) * plotW
  }

  const yScale = (r) => {
    return plotH - ((r - yMin) / yRange) * plotH
  }

  // Active interaction index (hover or keyboard focus)
  const activeIndex = hoveredIndex !== null ? hoveredIndex : focusedIndex

  // 6. Collision-Free X-Axis Calendar Day Ticks
  const xTicks = useMemo(() => {
    if (pointsData.length === 0) return []

    // Group first occurrences of unique calendar days
    const dayMap = new Map()
    pointsData.forEach((d, idx) => {
      if (!d.date) return
      try {
        const dayKey = new Date(d.date).toISOString().slice(0, 10)
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, { idx, date: new Date(d.date) })
        }
      } catch { }
    })

    const uniqueDays = Array.from(dayMap.values())
    if (uniqueDays.length === 0) return []

    // Multi-year check
    const firstYear = uniqueDays[0].date.getFullYear()
    const lastYear = uniqueDays[uniqueDays.length - 1].date.getFullYear()
    const showYear = firstYear !== lastYear

    // Target max ticks based on responsive width
    const maxTicks = svgWidth < 480 ? 3 : svgWidth < 820 ? 4 : 6
    const step = Math.max(1, Math.ceil(uniqueDays.length / maxTicks))

    const ticks = []
    const usedLabels = new Set()

    for (let i = 0; i < uniqueDays.length; i += step) {
      const item = uniqueDays[i]
      const label = item.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(showYear ? { year: '2-digit' } : {}),
      })
      if (!usedLabels.has(label)) {
        usedLabels.add(label)
        ticks.push({
          x: xScale(item.idx, pointsData.length),
          label,
        })
      }
    }

    // Ensure last day is included if not collided
    const lastItem = uniqueDays[uniqueDays.length - 1]
    const lastLabel = lastItem.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(showYear ? { year: '2-digit' } : {}),
    })
    const lastX = xScale(lastItem.idx, pointsData.length)

    if (!usedLabels.has(lastLabel)) {
      if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1].x - lastX) > 60) {
        ticks.push({ x: lastX, label: lastLabel })
      }
    }

    return ticks
  }, [pointsData, svgWidth, plotW])

  // Build SVG path
  const linePath = useMemo(() => {
    if (renderPoints.length === 0) return ''
    if (renderPoints.length === 1) {
      const y = yScale(Number(renderPoints[0].rating) || 1200)
      return `M 0 ${y} L ${plotW} ${y}`
    }
    const coords = renderPoints.map((d, i) => [
      xScale(i, renderPoints.length),
      yScale(Number(d.rating) || 1200),
    ])

    let path = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`
    for (let i = 1; i < coords.length; i++) {
      path += ` L ${coords[i][0].toFixed(1)} ${coords[i][1].toFixed(1)}`
    }
    return path
  }, [renderPoints, plotW, yMin, yRange])

  // Flat area fill at 4% opacity
  const areaPath = useMemo(() => {
    if (!linePath || renderPoints.length <= 1) return ''
    const lastX = xScale(renderPoints.length - 1, renderPoints.length)
    return `${linePath} L ${lastX.toFixed(1)} ${plotH} L 0 ${plotH} Z`
  }, [linePath, renderPoints, plotH])

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (pointsData.length <= 1) return
    const current = activeIndex !== null ? activeIndex : pointsData.length - 1

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = Math.min(pointsData.length - 1, current + 1)
      setFocusedIndex(next)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = Math.max(0, current - 1)
      setFocusedIndex(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setFocusedIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setFocusedIndex(pointsData.length - 1)
    }
  }

  // Active point metadata for tooltip & screen-reader announcement
  const activePoint = activeIndex !== null ? pointsData[activeIndex] : null
  const activeCoords = activeIndex !== null ? [
    xScale(activeIndex, pointsData.length),
    yScale(Number(activePoint?.rating) || 1200),
  ] : null

  const activeAnnouncement = useMemo(() => {
    if (!activePoint || activeIndex === null) return ''
    const opp = activePoint.opponent ? `against ${activePoint.opponent}` : ''
    const res = (activePoint.delta || 0) >= 0 ? 'win' : 'loss'
    const sign = (activePoint.delta || 0) >= 0 ? 'plus' : 'minus'
    const oldR = activePoint.old_rating || (Number(activePoint.rating) - (activePoint.delta || 0))
    return `Match ${activeIndex + 1}, ${res} ${opp}, ${oldR} to ${activePoint.rating}, ${sign} ${Math.abs(activePoint.delta || 0)}`
  }, [activePoint, activeIndex])

  // Honest empty state when fewer than 2 points
  if (pointsData.length < 2) {
    return (
      <div className="rating-chart-v2-container">
        <div className="section-heading-row">
          <div>
            <h2 className="section-title">Rating history</h2>
            <p className="section-subtitle">Your rating after each match.</p>
          </div>
        </div>

        <div className="chart-empty-state">
          <p className="empty-state-copy">Play 2 matches to see your rating history.</p>
          {onNavigateLobby && (
            <button
              type="button"
              onClick={onNavigateLobby}
              className="btn-action"
              style={{ background: 'var(--ink)', color: 'var(--bg-0)', fontWeight: 600, padding: '8px 16px' }}
            >
              Go to Lobby
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rating-chart-v2-container">
      {/* ── Heading Row + Segmented Range Control ──────────────── */}
      <div className="contest-rating-header">
        <div className="contest-rating-hero">
          <span className="contest-rating-label">Contest Rating</span>
          <div className="contest-rating-stats">
            <span
              className="contest-rating-main"
              style={{ color: currentTier.color }}
            >
              {Number(currentRating).toLocaleString()}
            </span>
            <div className="contest-rating-substats">
              <span className="substat-item">Peak <strong style={{ color: peakTier.color }}>{Number(peakRating).toLocaleString()}</strong></span>
              <span className="substat-dot">•</span>
              <span className="substat-item">Attended <strong>{Number(pointsData.length).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div className="contest-rating-controls">
          {/* Segmented Range Control (Filters loaded data client-side only) */}
          <div className="chart-range-segmented" role="group" aria-label="Rating history time range">
            <button
              type="button"
              className={`range-pill ${range === 'last20' ? 'active' : ''}`}
              onClick={() => { setRange('last20'); setHoveredIndex(null); setFocusedIndex(null) }}
            >
              Last 20
            </button>
            <button
              type="button"
              className={`range-pill ${range === '30d' ? 'active' : ''}`}
              onClick={() => { setRange('30d'); setHoveredIndex(null); setFocusedIndex(null) }}
            >
              30 days
            </button>
            <button
              type="button"
              className={`range-pill ${range === 'all' ? 'active' : ''}`}
              onClick={() => { setRange('all'); setHoveredIndex(null); setFocusedIndex(null) }}
            >
              All time
            </button>
          </div>

          {/* Accessible Table View Toggle */}
          <button
            type="button"
            className="chart-table-toggle-btn"
            onClick={() => setShowTable(!showTable)}
            aria-expanded={showTable}
          >
            {showTable ? 'View chart' : 'View as table'}
          </button>
        </div>
      </div>

      {/* ── Accessible Table Mode ──────────────────────────────── */}
      {showTable ? (
        <div className="chart-accessible-table-wrap">
          <table className="chart-accessible-table">
            <caption className="sr-only">Rating progression history</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Date</th>
                <th scope="col">Opponent</th>
                <th scope="col">Topic</th>
                <th scope="col">Rating</th>
                <th scope="col">Delta</th>
              </tr>
            </thead>
            <tbody>
              {pointsData.map((d, i) => {
                const dateStr = d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'
                const deltaNum = Number(d.delta) || 0
                const deltaStr = d.delta !== undefined ? (deltaNum > 0 ? `+${deltaNum}` : `${deltaNum}`) : '-'
                const deltaColor = deltaNum > 0 ? '#10b981' : deltaNum < 0 ? '#f43f5e' : 'var(--sub, #a2a9b8)'
                const rowTier = getTierForRating(d.rating)
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{dateStr}</td>
                    <td>{d.opponent ? `@${d.opponent}` : '-'}</td>
                    <td>{d.topic || 'Custom'}</td>
                    <td style={{ color: rowTier.color, fontWeight: 600 }}>{d.rating}</td>
                    <td style={{ color: deltaColor, fontWeight: 600 }}>{deltaStr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── SVG Plot Surface ─────────────────────────────────── */
        <div
          ref={chartRef}
          className="chart-plot-surface"
          tabIndex={0}
          role="region"
          aria-label="Rating progression chart. Use Left and Right arrow keys to navigate through matches."
          onKeyDown={handleKeyDown}
        >
          {/* Screen Reader Announcement Live Region */}
          <div aria-live="polite" className="sr-only">
            {activeAnnouncement}
          </div>

          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="chart-svg-root"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <g transform={`translate(${PADDING.left},${PADDING.top})`}>
              {/* 1. Horizontal Tier Bands (Alternating --bg-1 and --bg-2) */}
              {visibleTiers.map((tier, idx) => {
                const tMax = tier.nextThreshold !== null ? tier.nextThreshold : yMax
                const yTop = Math.max(0, Math.min(plotH, yScale(Math.min(yMax, tMax))))
                const yBottom = Math.max(0, Math.min(plotH, yScale(Math.max(yMin, tier.threshold))))
                const bandH = yBottom - yTop
                if (bandH <= 0) return null

                const isEven = idx % 2 === 0

                return (
                  <g key={tier.name}>
                    <rect
                      x={0}
                      y={yTop}
                      width={plotW}
                      height={bandH}
                      fill={isEven ? 'rgba(255, 255, 255, 0.018)' : 'transparent'}
                    />
                    {/* Tier Name on right edge */}
                    <text
                      x={plotW + 8}
                      y={yTop + bandH / 2 + 4}
                      className="tier-band-label"
                    >
                      {tier.name}
                    </text>
                  </g>
                )
              })}

              {/* 2. Horizontal Hairline Dividers at Thresholds & Ticks */}
              {yTicks.map(r => {
                const y = yScale(r)
                const isThreshold = [1200, 1400, 1600, 1800, 2000].includes(r)
                return (
                  <g key={r}>
                    <line
                      x1={0}
                      y1={y}
                      x2={plotW}
                      y2={y}
                      stroke="var(--hair-muted, rgba(196, 214, 232, 0.16))"
                      strokeWidth={1}
                      strokeDasharray={isThreshold ? 'none' : '3 3'}
                    />
                    {/* Y-Axis Value Label */}
                    <text
                      x={-8}
                      y={y + 3.5}
                      className="y-tick-label"
                    >
                      {r}
                    </text>
                  </g>
                )
              })}

              {/* 3. Collision-Free Calendar Day X-Ticks */}
              {xTicks.map(t => (
                <g key={t.label}>
                  <line
                    x1={t.x}
                    y1={0}
                    x2={t.x}
                    y2={plotH}
                    stroke="var(--hair-subtle, rgba(196, 214, 232, 0.08))"
                    strokeWidth={1}
                  />
                  <text
                    x={t.x}
                    y={plotH + 18}
                    className="x-tick-label"
                  >
                    {t.label}
                  </text>
                </g>
              ))}

              {/* 3.5. Dashed Tier Threshold Reference Line (e.g. 1200 Apprentice baseline) */}
              {yMin <= 1200 && yMax >= 1200 && (
                <g className="tier-threshold-line">
                  <line
                    x1={0}
                    y1={yScale(1200)}
                    x2={plotW}
                    y2={yScale(1200)}
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    opacity={0.85}
                  />
                </g>
              )}

              {/* 4. Area Fill + Rank-Colored Segments and Nodes */}
              {areaPath && (
                <path d={areaPath} fill="rgba(16, 185, 129, 0.04)" />
              )}

              {/* Multi-Colored Line Segments by Rank/Tier */}
              {renderPoints.length > 1 && renderPoints.map((p, i) => {
                if (i === renderPoints.length - 1) return null
                const pNext = renderPoints[i + 1]
                const x1 = xScale(i, renderPoints.length)
                const y1 = yScale(Number(p.rating) || 1200)
                const x2 = xScale(i + 1, renderPoints.length)
                const y2 = yScale(Number(pNext.rating) || 1200)
                const avgR = (Number(p.rating) + Number(pNext.rating)) / 2
                const segTier = getTierForRating(avgR)

                return (
                  <line
                    key={`seg-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={segTier.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="chart-draw-line"
                  />
                )
              })}

              {/* Match Point Circular Nodes Colored by Rank Tier */}
              {renderPoints.length <= 80 && renderPoints.map((p, i) => {
                const x = xScale(i, renderPoints.length)
                const y = yScale(Number(p.rating) || 1200)
                const pTier = getTierForRating(p.rating)

                return (
                  <circle
                    key={`node-${i}`}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={pTier.color}
                    stroke="#060d1c"
                    strokeWidth={1.5}
                  />
                )
              })}

              {/* 5. Key Markers (Peak Badge Marker + Current Rating) */}
              {/* Peak Marker: Special double-marker with chevron up */}
              {pointsData.length > 1 && (
                <g transform={`translate(${xScale(peakIdx, pointsData.length)}, ${yScale(peakRating)})`}>
                  <circle r={5} fill="#f59e0b" stroke="#060d1c" strokeWidth={1.5} />
                  <g transform="translate(0, -14)">
                    <circle r={6.5} fill="#f59e0b" />
                    <path d="M-2.5 1 L0 -1.5 L2.5 1" fill="none" stroke="#060d1c" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <text
                    x={0}
                    y={-24}
                    textAnchor="middle"
                    className="peak-marker-label"
                    style={{ fill: '#f59e0b', fontWeight: 600, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  >
                    Peak {peakRating}
                  </text>
                </g>
              )}

              {/* Current Rating Marker: 6px filled gold circle */}
              {pointsData.length > 0 && (
                <g transform={`translate(${xScale(pointsData.length - 1, pointsData.length)}, ${yScale(currentRating)})`}>
                  <circle
                    r={5}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                  <text
                    x={-8}
                    y={-10}
                    textAnchor="end"
                    className="now-marker-label"
                    style={{ fill: '#f59e0b', fontWeight: 600, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  >
                    Now {currentRating}
                  </text>
                </g>
              )}



              {/* 7. Hover / Touch Interactive Target Bars */}
              {pointsData.map((_, i) => {
                const x = xScale(i, pointsData.length)
                const barW = Math.max(14, plotW / pointsData.length)
                return (
                  <rect
                    key={`hit-${i}`}
                    x={x - barW / 2}
                    y={0}
                    width={barW}
                    height={plotH + 36}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIndex(i)}
                  />
                )
              })}

              {/* 8. Active Inspection Hairline, Highlight Ring & Tooltip */}
              {activeCoords && activePoint && (
                <g>
                  {/* Vertical Hairline */}
                  <line
                    x1={activeCoords[0]}
                    y1={0}
                    x2={activeCoords[0]}
                    y2={plotH}
                    stroke="var(--hair, rgba(196, 214, 232, 0.72))"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />

                  {/* Active Point Highlight Ring */}
                  <circle
                    cx={activeCoords[0]}
                    cy={activeCoords[1]}
                    r={6}
                    fill="none"
                    stroke="var(--gold, #ffd696)"
                    strokeWidth={2}
                  />

                  {/* Flat Tonal Tooltip Panel (No heavy shadows, no glass) */}
                  <foreignObject
                    x={activeCoords[0] > plotW - 190 ? activeCoords[0] - 195 : activeCoords[0] + 12}
                    y={Math.max(0, Math.min(plotH - 80, activeCoords[1] - 30))}
                    width={185}
                    height={86}
                    className="chart-tooltip-foreign"
                  >
                    <div className="chart-tooltip-panel">
                      <div className="tooltip-header">
                        <span>Match #{activeIndex + 1}</span>
                        <span className="tooltip-delta">
                          {(activePoint.delta || 0) >= 0 ? `+${activePoint.delta || 0}` : `${activePoint.delta}`}
                        </span>
                      </div>
                      <div className="tooltip-row">
                        <span>{activePoint.opponent ? `vs @${activePoint.opponent}` : '1v1 Duel'}</span>
                        <span className="tooltip-rating">{activePoint.rating}</span>
                      </div>
                      <div className="tooltip-meta">
                        <span>{activePoint.topic || 'General'}</span>
                        <span>
                          {activePoint.date
                            ? new Date(activePoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </foreignObject>
                </g>
              )}
            </g>
          </svg>
        </div>
      )}


    </div>
  )
}
