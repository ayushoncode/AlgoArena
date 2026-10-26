import React from 'react'

/**
 * Skeleton Primitives for Below-the-fold Async Blocks
 * Designed to prevent layout shifts with matching dimensions and polite empty/error states.
 */

export function SkeletonLine({ height = 18, width = '100%', className = '' }) {
  return (
    <div
      className={`home-skeleton-shimmer ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width }}
      aria-hidden="true"
    />
  )
}

export function SkeletonBlock({ height = 120, width = '100%', className = '' }) {
  return (
    <div
      className={`home-skeleton-shimmer ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width }}
      aria-hidden="true"
    />
  )
}

export function SkeletonPodium() {
  return (
    <div className="skeleton-podium-wrap" aria-hidden="true">
      <div className="skeleton-podium-item plinth-silver" style={{ height: '220px' }}>
        <div className="home-skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="skeleton-podium-item plinth-gold" style={{ height: '260px' }}>
        <div className="home-skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="skeleton-podium-item plinth-bronze" style={{ height: '180px' }}>
        <div className="home-skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}

export function AsyncState({
  loading,
  error,
  empty,
  emptyMessage = 'No records available currently.',
  errorMessage = 'Failed to load live data.',
  onRetry,
  skeleton,
  children,
}) {
  if (loading) {
    return skeleton || <SkeletonBlock height={140} />
  }

  if (error) {
    return (
      <div className="async-state-box error-box" role="alert">
        <p className="async-message text-sub">{errorMessage}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="async-retry-btn">
            Retry connection
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="async-state-box empty-box">
        <p className="async-message text-sub">{emptyMessage}</p>
      </div>
    )
  }

  return children
}
