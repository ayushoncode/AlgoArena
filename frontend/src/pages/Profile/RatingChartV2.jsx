import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { CANONICAL_TIERS, getTierForRating } from '../../lib/tiers'

const VIEW_W = 800
const VIEW_H = 280
const PADDING = { top: 36, right: 90, bottom: 42, left: 56 }

export default function RatingChartV2({
  data = [],
  elo = 1200,
  username = '',
  isOwnProfile = true,
  onNavigateLobby,
}) {
  const [range, setRange] = useState('all') // 'last20' | '30d' | 'all'
  const [zoomRange, setZoomRange] = useState(null) // [startIndex, endIndex] or null
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(null)
  const [showTable, setShowTable] = useState(false)
  const [svgWidth, setSvgWidth] = useState(VIEW_W)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState(null) // { startX, currentX }
  const chartRef = useRef(null)

  // Measure container width for responsive x-axis ticks
  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver((entries) => {
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
      const subset = sortedRaw.filter(
        (d) => d.date && new Date(d.date).getTime() >= thirtyDaysAgo
      )
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

  // 4. Active Points: Either full pointsData or zoomed slice
  const activePoints = useMemo(() => {
    if (!zoomRange || pointsData.length <= 2) return pointsData
    const [s, e] = zoomRange
    const clampedS = Math.max(0, Math.min(pointsData.length - 2, s))
    const clampedE = Math.min(pointsData.length - 1, Math.max(clampedS + 1, e))
    return pointsData.slice(clampedS, clampedE + 1)
  }, [pointsData, zoomRange])

  // Handle range pill clicks
  const handleRangeChange = (newRange) => {
    setRange(newRange)
    setZoomRange(null)
    setHoveredIndex(null)
    setFocusedIndex(null)
  }

  // 5. Downsampling for rendering if points > 400 (keeps first, peak, min, last)
  const renderPoints = useMemo(() => {
    if (activePoints.length <= 400) return activePoints
    const total = activePoints.length
    const step = Math.ceil(total / 380)
    let peakIdx = 0
    let minIdx = 0
    let maxR = -Infinity
    let minR = Infinity

    activePoints.forEach((d, idx) => {
      const r = Number(d.rating) || 1200
      if (r > maxR) {
        maxR = r
        peakIdx = idx
      }
      if (r < minR) {
        minR = r
        minIdx = idx
      }
    })

    const selected = new Set([0, peakIdx, minIdx, total - 1])
    for (let i = 0; i < total; i += step) {
      selected.add(i)
    }

    return Array.from(selected)
      .sort((a, b) => a - b)
      .map((i) => activePoints[i])
  }, [activePoints])

  // 6. Y-Range calculation with automatic padding so line never touches edges
  const { yMin, yMax, yRange, yTicks, visibleTiers, peakRating, peakIdx, currentRating } =
    useMemo(() => {
      if (activePoints.length === 0) {
        return {
          yMin: 1000,
          yMax: 1400,
          yRange: 400,
          yTicks: [1000, 1200, 1400],
          visibleTiers: [],
          peakRating: 1200,
          peakIdx: 0,
          currentRating: 1200,
        }
      }

      const ratings = activePoints.map((d) => Number(d.rating) || 1200)
      let maxVal = -Infinity
      let minVal = Infinity
      let pIdx = 0

      ratings.forEach((r, i) => {
        if (r > maxVal) {
          maxVal = r
          pIdx = i
        }
        if (r < minVal) {
          minVal = r
        }
      })

      const spread = maxVal - minVal
      const step = spread > 400 ? 100 : 50
      const pad = Math.max(30, Math.ceil(spread * 0.15))
      const calculatedMin = Math.max(0, Math.floor((minVal - pad) / step) * step)
      const calculatedMax = Math.max(calculatedMin + step * 3, Math.ceil((maxVal + pad) / step) * step)
      const rangeVal = calculatedMax - calculatedMin || 1

      const ticks = []
      for (let r = calculatedMin; r <= calculatedMax; r += step) {
        ticks.push(r)
      }

      // Visible tier bands falling inside [calculatedMin, calculatedMax]
      const tiers = CANONICAL_TIERS.filter((t) => {
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
    }, [activePoints])

  const currentTier = useMemo(() => getTierForRating(currentRating), [currentRating])
  const peakTier = useMemo(() => getTierForRating(peakRating), [peakRating])

  // Plot geometry
  const plotW = VIEW_W - PADDING.left - PADDING.right
  const plotH = VIEW_H - PADDING.top - PADDING.bottom

  const xScale = useCallback(
    (idx, total) => {
      if (total <= 1) return plotW / 2
      return (idx / (total - 1)) * plotW
    },
    [plotW]
  )

  const yScale = useCallback(
    (r) => {
      return plotH - ((r - yMin) / yRange) * plotH
    },
    [plotH, yMin, yRange]
  )

  // Active interaction index (hover or keyboard focus)
  const activeIndex = hoveredIndex !== null ? hoveredIndex : focusedIndex

  // 7. Collision-Free X-Axis Calendar Day Ticks
  const xTicks = useMemo(() => {
    if (activePoints.length === 0) return []

    // Group first occurrences of unique calendar days
    const dayMap = new Map()
    activePoints.forEach((d, idx) => {
      if (!d.date) return
      try {
        const dayKey = new Date(d.date).toISOString().slice(0, 10)
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, { idx, date: new Date(d.date) })
        }
      } catch {}
    })

    const uniqueDays = Array.from(dayMap.values())
    if (uniqueDays.length === 0) return []

    const firstYear = uniqueDays[0].date.getFullYear()
    const lastYear = uniqueDays[uniqueDays.length - 1].date.getFullYear()
    const showYear = firstYear !== lastYear

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
          x: xScale(item.idx, activePoints.length),
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
    const lastX = xScale(lastItem.idx, activePoints.length)

    if (!usedLabels.has(lastLabel)) {
      if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1].x - lastX) > 60) {
        ticks.push({ x: lastX, label: lastLabel })
      }
    }

    return ticks
  }, [activePoints, svgWidth, xScale])

  // Area fill under curve
  const areaPath = useMemo(() => {
    if (renderPoints.length <= 1) return ''
    const coords = renderPoints.map((d, i) => [
      xScale(i, renderPoints.length),
      yScale(Number(d.rating) || 1200),
    ])
    let path = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`
    for (let i = 1; i < coords.length; i++) {
      path += ` L ${coords[i][0].toFixed(1)} ${coords[i][1].toFixed(1)}`
    }
    const lastX = xScale(renderPoints.length - 1, renderPoints.length)
    return `${path} L ${lastX.toFixed(1)} ${plotH} L 0 ${plotH} Z`
  }, [renderPoints, plotH, xScale, yScale])

  // Map mouse coordinate to SVG plot space
  const getPlotCoords = useCallback(
    (e) => {
      if (!chartRef.current) return { x: 0, y: 0 }
      const rect = chartRef.current.getBoundingClientRect()
      const scaleX = VIEW_W / rect.width
      const scaleY = VIEW_H / rect.height
      const clientX = e.clientX - rect.left
      const clientY = e.clientY - rect.top
      const x = clientX * scaleX - PADDING.left
      const y = clientY * scaleY - PADDING.top
      return {
        x: Math.max(0, Math.min(plotW, x)),
        y: Math.max(0, Math.min(plotH, y)),
      }
    },
    [plotW, plotH]
  )

  // Cursor drag selection (Box Zoom like in Codeforces)
  const handleMouseDown = (e) => {
    if (e.button !== 0 || activePoints.length <= 2) return
    const { x } = getPlotCoords(e)
    setIsSelecting(true)
    setSelectionBox({ startX: x, currentX: x })
  }

  const handleMouseMove = (e) => {
    const { x } = getPlotCoords(e)
    if (isSelecting && selectionBox) {
      setSelectionBox((prev) => ({ ...prev, currentX: x }))
    } else {
      // Find nearest point index for hover tooltip
      if (activePoints.length > 0) {
        const ratio = Math.max(0, Math.min(1, x / plotW))
        const idx = Math.round(ratio * (activePoints.length - 1))
        setHoveredIndex(idx)
      }
    }
  }

  const handleMouseUp = () => {
    if (isSelecting && selectionBox) {
      const dist = Math.abs(selectionBox.currentX - selectionBox.startX)
      if (dist > 15) {
        const minX = Math.min(selectionBox.startX, selectionBox.currentX)
        const maxX = Math.max(selectionBox.startX, selectionBox.currentX)
        const visibleTotal = activePoints.length
        const baseOffset = zoomRange ? zoomRange[0] : 0

        const sLocal = Math.max(0, Math.floor((minX / plotW) * (visibleTotal - 1)))
        const eLocal = Math.min(visibleTotal - 1, Math.ceil((maxX / plotW) * (visibleTotal - 1)))

        if (eLocal - sLocal >= 1) {
          const globalStart = baseOffset + sLocal
          const globalEnd = baseOffset + eLocal
          setZoomRange([globalStart, globalEnd])
        }
      }
      setIsSelecting(false)
      setSelectionBox(null)
    }
  }

  // Wheel zoom with cursor position
  const handleWheel = (e) => {
    if (pointsData.length <= 2) return
    e.preventDefault()

    const { x } = getPlotCoords(e)
    const ratio = Math.max(0, Math.min(1, x / plotW))
    const curStart = zoomRange ? zoomRange[0] : 0
    const curEnd = zoomRange ? zoomRange[1] : pointsData.length - 1
    const curSpan = curEnd - curStart

    if (e.deltaY < 0) {
      // Zoom IN (shrink window by 25%)
      if (curSpan <= 2) return
      const newSpan = Math.max(2, Math.round(curSpan * 0.75))
      const centerIdx = curStart + Math.round(ratio * curSpan)
      const newStart = Math.max(
        0,
        Math.min(pointsData.length - 1 - newSpan, Math.round(centerIdx - ratio * newSpan))
      )
      const newEnd = Math.min(pointsData.length - 1, newStart + newSpan)
      setZoomRange([newStart, newEnd])
    } else {
      // Zoom OUT (expand window by 35%)
      if (!zoomRange) return
      const newSpan = Math.round(curSpan * 1.35)
      if (newSpan >= pointsData.length - 1) {
        setZoomRange(null)
      } else {
        const centerIdx = curStart + Math.round(ratio * curSpan)
        const newStart = Math.max(
          0,
          Math.min(pointsData.length - 1 - newSpan, Math.round(centerIdx - ratio * newSpan))
        )
        const newEnd = Math.min(pointsData.length - 1, newStart + newSpan)
        setZoomRange([newStart, newEnd])
      }
    }
  }

  // Step zoom in/out with + / - buttons
  const handleStepZoom = (dir) => {
    const curStart = zoomRange ? zoomRange[0] : 0
    const curEnd = zoomRange ? zoomRange[1] : pointsData.length - 1
    const curSpan = curEnd - curStart

    if (dir < 0) {
      // Zoom IN
      if (curSpan <= 2) return
      const newSpan = Math.max(2, Math.round(curSpan * 0.7))
      const mid = Math.round((curStart + curEnd) / 2)
      const newStart = Math.max(0, mid - Math.round(newSpan / 2))
      const newEnd = Math.min(pointsData.length - 1, newStart + newSpan)
      setZoomRange([newStart, newEnd])
    } else {
      // Zoom OUT
      if (!zoomRange) return
      const newSpan = Math.round(curSpan * 1.4)
      if (newSpan >= pointsData.length - 1) {
        setZoomRange(null)
      } else {
        const mid = Math.round((curStart + curEnd) / 2)
        const newStart = Math.max(0, mid - Math.round(newSpan / 2))
        const newEnd = Math.min(pointsData.length - 1, newStart + newSpan)
        setZoomRange([newStart, newEnd])
      }
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (activePoints.length <= 1) return
    const current = activeIndex !== null ? activeIndex : activePoints.length - 1

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = Math.min(activePoints.length - 1, current + 1)
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
      setFocusedIndex(activePoints.length - 1)
    } else if (e.key === 'Escape') {
      setZoomRange(null)
    }
  }

  // Active point metadata for tooltip & screen-reader announcement
  const activePoint = activeIndex !== null ? activePoints[activeIndex] : null
  const activeCoords =
    activeIndex !== null
      ? [
          xScale(activeIndex, activePoints.length),
          yScale(Number(activePoint?.rating) || 1200),
        ]
      : null

  // Screen-reader announcement string
  const activeAnnouncement = activePoint
    ? `Match on ${activePoint.date ? new Date(activePoint.date).toLocaleDateString() : 'recent'}: Rating ${activePoint.rating}, change ${activePoint.delta > 0 ? `+${activePoint.delta}` : activePoint.delta}`
    : ''

  // Rank Tier Background Band Fill
  const getTierBandFill = (name) => {
    switch (name) {
      case 'Novice':
        return 'rgba(148, 163, 184, 0.08)'
      case 'Apprentice':
        return 'rgba(16, 185, 129, 0.12)'
      case 'Specialist':
        return 'rgba(6, 182, 212, 0.12)'
      case 'Expert':
        return 'rgba(59, 130, 246, 0.12)'
      case 'Candidate Master':
        return 'rgba(168, 85, 247, 0.12)'
      case 'Grandmaster':
        return 'rgba(249, 115, 22, 0.12)'
      default:
        return 'rgba(148, 163, 184, 0.08)'
    }
  }

  return (
    <div className="rating-chart-v2-container">
      {/* ── Heading Row + Controls ──────────────── */}
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
              <span className="substat-item">
                Peak <strong style={{ color: peakTier.color }}>{Number(peakRating).toLocaleString()}</strong>
              </span>
              <span className="substat-dot">•</span>
              <span className="substat-item">
                Attended <strong>{Number(pointsData.length).toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="contest-rating-controls">
          {/* Zoom In / Out Buttons */}
          <div className="chart-zoom-group" role="group" aria-label="Chart zoom controls">
            <button
              type="button"
              className="chart-zoom-btn"
              title="Zoom in"
              onClick={() => handleStepZoom(-1)}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="chart-zoom-btn"
              title="Zoom out"
              disabled={!zoomRange}
              onClick={() => handleStepZoom(1)}
              aria-label="Zoom out"
            >
              -
            </button>
          </div>

          {/* Reset Zoom Button (Appears when zoomed) */}
          {zoomRange && (
            <button
              type="button"
              className="chart-reset-zoom-btn"
              onClick={() => setZoomRange(null)}
              title="Reset zoom to full view (Double-click chart)"
            >
              <span>Reset zoom</span>
            </button>
          )}

          {/* Segmented Range Control */}
          <div className="chart-range-segmented" role="group" aria-label="Rating history time range">
            <button
              type="button"
              className={`range-pill ${range === 'last20' && !zoomRange ? 'active' : ''}`}
              onClick={() => handleRangeChange('last20')}
            >
              Last 20
            </button>
            <button
              type="button"
              className={`range-pill ${range === '30d' && !zoomRange ? 'active' : ''}`}
              onClick={() => handleRangeChange('30d')}
            >
              30 days
            </button>
            <button
              type="button"
              className={`range-pill ${range === 'all' && !zoomRange ? 'active' : ''}`}
              onClick={() => handleRangeChange('all')}
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
              {activePoints.map((d, i) => {
                const dateStr = d.date
                  ? new Date(d.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'
                const deltaNum = Number(d.delta) || 0
                const deltaStr =
                  d.delta !== undefined ? (deltaNum > 0 ? `+${deltaNum}` : `${deltaNum}`) : '-'
                const deltaColor =
                  deltaNum > 0 ? '#10b981' : deltaNum < 0 ? '#f43f5e' : 'var(--sub, #a2a9b8)'
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
        /* ── SVG Plot Surface (Clean Rank-Tier Colored) ────────── */
        <div
          ref={chartRef}
          className="chart-plot-surface"
          tabIndex={0}
          role="region"
          aria-label="Rating progression chart. Drag cursor horizontally or scroll wheel to zoom in/out. Double-click to reset."
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={() => setZoomRange(null)}
          style={{ cursor: isSelecting ? 'col-resize' : 'crosshair' }}
        >
          {/* Screen Reader Announcement Live Region */}
          <div aria-live="polite" className="sr-only">
            {activeAnnouncement}
          </div>

          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="chart-svg-root"
            onMouseLeave={() => {
              if (isSelecting) {
                setIsSelecting(false)
                setSelectionBox(null)
              }
              setHoveredIndex(null)
            }}
          >
            <defs>
              <clipPath id="plot-area-clip">
                <rect x={0} y={0} width={plotW} height={plotH} />
              </clipPath>
            </defs>

            <g transform={`translate(${PADDING.left},${PADDING.top})`}>
              {/* 1. Rank Tier Background Color Bands */}
              {visibleTiers.map((tier) => {
                const tMax = tier.nextThreshold !== null ? tier.nextThreshold : yMax
                const yTop = Math.max(0, Math.min(plotH, yScale(Math.min(yMax, tMax))))
                const yBottom = Math.max(0, Math.min(plotH, yScale(Math.max(yMin, tier.threshold))))
                const bandH = yBottom - yTop
                if (bandH <= 0) return null

                const bandFill = getTierBandFill(tier.name)

                return (
                  <g key={tier.name}>
                    {/* Colored Tier Band */}
                    <rect
                      x={0}
                      y={yTop}
                      width={plotW}
                      height={bandH}
                      fill={bandFill}
                    />

                    {/* Top Divider Hairline */}
                    <line
                      x1={0}
                      y1={yTop}
                      x2={plotW}
                      y2={yTop}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth={1}
                    />

                    {/* Tier Name on right edge */}
                    <text
                      x={plotW + 8}
                      y={yTop + bandH / 2 + 4}
                      className="tier-band-label"
                      style={{ fill: tier.color, fontWeight: 600, fontSize: 10, opacity: 0.8 }}
                    >
                      {tier.name}
                    </text>
                  </g>
                )
              })}

              {/* 2. Horizontal Dividers & Ticks on Y-Axis */}
              {yTicks.map((r) => {
                const y = yScale(r)
                const isThreshold = [1200, 1400, 1600, 1800, 2000].includes(r)
                return (
                  <g key={r}>
                    {isThreshold && (
                      <line
                        x1={0}
                        y1={y}
                        x2={plotW}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.18)"
                        strokeWidth={1}
                      />
                    )}
                    {/* Y-Axis Value Label */}
                    <text
                      x={-8}
                      y={y + 3.5}
                      className="y-tick-label"
                      style={{ fontWeight: isThreshold ? 700 : 500 }}
                    >
                      {r}
                    </text>
                  </g>
                )
              })}

              {/* 3. Calendar Day X-Ticks */}
              {xTicks.map((t) => (
                <g key={t.label}>
                  <line
                    x1={t.x}
                    y1={plotH}
                    x2={t.x}
                    y2={plotH + 4}
                    stroke="rgba(255, 255, 255, 0.2)"
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

              {/* Outer Plot Border */}
              <rect
                x={0}
                y={0}
                width={plotW}
                height={plotH}
                fill="none"
                stroke="rgba(255, 255, 255, 0.18)"
                strokeWidth={1}
              />

              {/* 4. Area Fill + Rank-Tier Segmented Line Inside Clip Path */}
              <g clipPath="url(#plot-area-clip)">
                {areaPath && (
                  <path d={areaPath} fill="rgba(16, 185, 129, 0.04)" />
                )}

                {/* Multi-Colored Line Segments by Rank/Tier (NO YELLOW!) */}
                {renderPoints.length > 1 &&
                  renderPoints.map((p, i) => {
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
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )
                  })}

                {/* Match Point Circular Nodes (Colored by Tier) */}
                {renderPoints.length <= 120 &&
                  renderPoints.map((p, i) => {
                    const x = xScale(i, renderPoints.length)
                    const y = yScale(Number(p.rating) || 1200)
                    const pTier = getTierForRating(p.rating)

                    return (
                      <circle
                        key={`node-${i}`}
                        cx={x}
                        cy={y}
                        r={3}
                        fill="#060d1c"
                        stroke={pTier.color}
                        strokeWidth={1.8}
                      />
                    )
                  })}

                {/* Drag Selection Box (Brush Zoom Overlay) */}
                {selectionBox && (
                  <rect
                    x={Math.min(selectionBox.startX, selectionBox.currentX)}
                    y={0}
                    width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                    height={plotH}
                    fill="rgba(56, 189, 248, 0.16)"
                    stroke="#38bdf8"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    pointerEvents="none"
                  />
                )}
              </g>

              {/* 5. Key Markers (Peak Badge Marker + Current Rating) */}
              {/* Peak Marker: Special double-marker with chevron up/down depending on headspace */}
              {activePoints.length > 1 && (() => {
                const px = xScale(peakIdx, activePoints.length)
                const py = yScale(peakRating)
                const placePeakBelow = py < 34
                const chevronOffsetY = placePeakBelow ? 14 : -14
                const badgeOffsetY = placePeakBelow ? 28 : -28
                return (
                  <g
                    transform={`translate(${px}, ${py})`}
                    pointerEvents="none"
                  >
                    <circle r={5} fill={peakTier.color} stroke="#060d1c" strokeWidth={1.5} />
                    <g transform={`translate(0, ${chevronOffsetY})`}>
                      <circle r={6.5} fill={peakTier.color} />
                      <path
                        d={placePeakBelow ? "M-2.5 -1 L0 1.5 L2.5 -1" : "M-2.5 1 L0 -1.5 L2.5 1"}
                        fill="none"
                        stroke="#060d1c"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                    {/* Peak label badge with solid dark background so lines never cut through */}
                    <g transform={`translate(0, ${badgeOffsetY})`}>
                      <rect
                        x={-34}
                        y={-9}
                        width={68}
                        height={18}
                        rx={4}
                        fill="#060d1c"
                        stroke={peakTier.color}
                        strokeWidth={1}
                        opacity={0.96}
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        style={{
                          fill: peakTier.color,
                          fontWeight: 700,
                          fontSize: 10,
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        Peak {peakRating}
                      </text>
                    </g>
                  </g>
                )
              })()}

              {/* Current Rating Marker: High-contrast badge with solid background placed safely in right margin */}
              {activePoints.length > 0 && (() => {
                const nowX = xScale(activePoints.length - 1, activePoints.length)
                const nowY = yScale(currentRating)
                const isAtPeak = peakIdx === activePoints.length - 1
                const badgeW = 76
                const badgeH = 20

                // Place in the clear right margin (outside plot lines) if space permits, else inside
                const hasRightSpace = (plotW - nowX) + PADDING.right >= badgeW + 8
                const badgeOffsetX = hasRightSpace ? 12 : -badgeW - 10
                // If at peak and peak is below, put badge above; if peak is above, put badge below; otherwise vertically centered
                const badgeOffsetY = isAtPeak
                  ? (nowY < 34 ? 14 : -14)
                  : 0

                return (
                  <g
                    transform={`translate(${nowX}, ${nowY})`}
                    pointerEvents="none"
                  >
                    {/* Outer glow ring */}
                    <circle
                      r={9}
                      fill="none"
                      stroke={currentTier.color}
                      strokeWidth={1.5}
                      opacity={0.65}
                    />
                    {/* Inner point dot */}
                    <circle
                      r={5}
                      fill={currentTier.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />

                    {/* Solid background pill: High-contrast, never obscured by zigzag lines */}
                    <g transform={`translate(${badgeOffsetX}, ${badgeOffsetY - badgeH / 2})`}>
                      <rect
                        width={badgeW}
                        height={badgeH}
                        rx={4}
                        fill="#060d1c"
                        stroke={currentTier.color}
                        strokeWidth={1.2}
                      />
                      <text
                        x={badgeW / 2}
                        y={13.5}
                        textAnchor="middle"
                        fontFamily="var(--font-mono, monospace)"
                        fontSize={10.5}
                      >
                        <tspan fill="#94a3b8" fontWeight={500}>Now </tspan>
                        <tspan fill={currentTier.color} fontWeight={700}>
                          {currentRating}
                        </tspan>
                      </text>
                    </g>
                  </g>
                )
              })()}

              {/* 6. Hover Reticle & Tooltip inside SVG (Clamped strictly within plot) */}
              {activeIndex !== null && activeCoords && activePoint && (() => {
                const formattedTopic = activePoint.topic
                  ? activePoint.topic
                      .replace(/[-_]/g, ' ')
                      .split(' ')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                      .join(' ')
                  : null
                const hasTopic = Boolean(formattedTopic)
                const dateStr = activePoint.date
                  ? new Date(activePoint.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent match'

                // Generous dynamic width so even long topics (e.g. Dynamic Programming) never overflow
                const topicChars = formattedTopic ? formattedTopic.length + 2 : 0
                const maxChars = Math.max(topicChars, dateStr.length, 16)
                const tipW = Math.max(188, Math.min(260, Math.round(maxChars * 7.5 + 24)))
                const tipH = hasTopic ? 68 : 48

                // Clamp X so tooltip never overflows outside plot
                let tipX = activeCoords[0] - tipW / 2
                if (tipX < 4) tipX = 4
                if (tipX + tipW > plotW - 4) tipX = plotW - tipW - 4

                // Position above the point; flip below if too close to top
                let tipY = activeCoords[1] - tipH - 14
                if (tipY < 4) tipY = activeCoords[1] + 14

                const pTier = getTierForRating(activePoint.rating)
                const deltaNum = Number(activePoint.delta) || 0
                const deltaStr =
                  activePoint.delta !== undefined
                    ? deltaNum > 0
                      ? `+${deltaNum}`
                      : `${deltaNum}`
                    : ''
                const deltaColor =
                  deltaNum > 0 ? '#10b981' : deltaNum < 0 ? '#f43f5e' : '#a2a9b8'

                return (
                  <g className="chart-reticle-group" pointerEvents="none">
                    {/* Crosshair guidelines */}
                    <line
                      x1={activeCoords[0]}
                      y1={0}
                      x2={activeCoords[0]}
                      y2={plotH}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={0}
                      y1={activeCoords[1]}
                      x2={plotW}
                      y2={activeCoords[1]}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />

                    {/* Active point highlight dot */}
                    <circle
                      cx={activeCoords[0]}
                      cy={activeCoords[1]}
                      r={6}
                      fill={pTier.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />

                    {/* SVG Tooltip Card (Directly above the point) */}
                    <g transform={`translate(${tipX}, ${tipY})`}>
                      <rect
                        width={tipW}
                        height={tipH}
                        rx={6}
                        fill="#070e1e"
                        stroke="rgba(196, 214, 232, 0.28)"
                        strokeWidth={1}
                      />
                      {/* Rating Number */}
                      <text
                        x={12}
                        y={21}
                        fill={pTier.color}
                        fontSize={15}
                        fontWeight={700}
                        fontFamily="var(--font-mono, monospace)"
                      >
                        {activePoint.rating}
                      </text>
                      {/* Delta */}
                      {deltaStr && (
                        <text
                          x={tipW - 12}
                          y={21}
                          textAnchor="end"
                          fill={deltaColor}
                          fontSize={13}
                          fontWeight={700}
                          fontFamily="var(--font-mono, monospace)"
                        >
                          {deltaStr}
                        </text>
                      )}
                      {/* Date */}
                      <text
                        x={12}
                        y={39}
                        fill="#8892a4"
                        fontSize={10.5}
                        fontFamily="var(--font-mono, monospace)"
                      >
                        {dateStr}
                      </text>
                      {/* Topic on its own row so it NEVER overflows */}
                      {hasTopic && (
                        <text
                          x={12}
                          y={54}
                          fill="#cbd5e1"
                          fontSize={10.5}
                          fontWeight={600}
                          fontFamily="var(--font-mono, monospace)"
                        >
                          • {formattedTopic}
                        </text>
                      )}
                    </g>
                  </g>
                )
              })()}

              {/* 7. Interactive Invisible Overlay Rect covering exact plot */}
              <rect
                x={0}
                y={0}
                width={plotW}
                height={plotH}
                fill="transparent"
                style={{ cursor: isSelecting ? 'col-resize' : 'crosshair' }}
              />
            </g>
          </svg>
        </div>
      )}

      {/* ── 8. Rank Tier Ladder Strip (Below Chart) ────────────────── */}
      <div className="chart-tier-ladder" role="region" aria-label="Rating tier thresholds">
        {CANONICAL_TIERS.map((tier) => {
          const rangeLabel = tier.nextThreshold
            ? `${tier.threshold}-${tier.nextThreshold - 1}`
            : `${tier.threshold}+`
          const isCurrent =
            currentRating >= tier.threshold &&
            (tier.nextThreshold === null || currentRating < tier.nextThreshold)

          return (
            <div
              key={tier.name}
              className={`tier-ladder-item ${isCurrent ? 'is-active-tier' : ''}`}
              title={`${tier.name}: ${rangeLabel} Elo`}
            >
              <div className="tier-ladder-header">
                <span
                  className="tier-ladder-dot"
                  style={{ backgroundColor: tier.color }}
                  aria-hidden="true"
                />
                <span
                  className="tier-ladder-name"
                  style={{ color: isCurrent ? tier.color : undefined }}
                >
                  {tier.name}
                </span>
                {isCurrent && isOwnProfile && (
                  <span className="tier-ladder-current-tag" style={{ backgroundColor: tier.color }}>
                    You
                  </span>
                )}
              </div>
              <span className="tier-ladder-range">{rangeLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
