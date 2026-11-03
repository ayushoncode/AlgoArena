import React from 'react'
import { IconFlame } from '../icons'

/**
 * StreakButton — Flame streak indicator button for AlgoArena navbar
 * 
 * Rules:
 * - Clicking navigates to the dedicated /daily page.
 * - If today's daily question is completed: flame glows with streak value.
 * - If any day is missed: streak is 0, flame does NOT glow, displays "0".
 */
export default function StreakButton({
  streak = 0,
  bestStreak = 0,
  isCompletedToday = false,
  isLoading = false,
  isError = false,
  onClick,
  buttonRef,
  id = 'nav-streak-btn'
}) {
  if (isLoading) {
    return (
      <div
        className="nav-v2-streak-skeleton"
        aria-hidden="true"
      />
    )
  }

  const isGlowing = Boolean(isCompletedToday && streak > 0)
  const isAlive = Boolean(streak > 0 && !isCompletedToday)

  let stateClass = 'is-muted'
  if (isGlowing) {
    stateClass = 'is-glowing'
  } else if (isAlive) {
    stateClass = 'is-alive'
  }

  const tooltip = isCompletedToday
    ? 'Daily Problem: Completed today'
    : streak > 0
    ? `Daily Problem: Solve today to keep your ${streak} day streak`
    : 'Daily Problem: Solve today to start your streak'

  return (
    <button
      ref={buttonRef}
      id={id}
      type="button"
      onClick={onClick}
      className={`nav-v2-streak-btn ${stateClass}`}
      aria-label="Daily Problem"
      title={tooltip}
    >
      <IconFlame size={20} filled={isGlowing} />
      {!isError && (
        <span className="nav-v2-streak-count">{streak}</span>
      )}
    </button>
  )
}
