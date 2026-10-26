import React from 'react'
import './GlassCta.css'

export default function GlassCta({
  onClick,
  children = 'Enter the arena',
  className = '',
  id = 'cta',
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-cta cta ${className}`}
      aria-label={typeof children === 'string' ? children : 'Enter the arena'}
      {...props}
    >
      <span id={id} className="glass-cta-text">{children}</span>
      <svg className="glass-cta-arrow arrow" viewBox="0 0 16 11" aria-hidden="true">
        <path d="M0 5.5 H14.6 M10.3 1.2 L14.9 5.5 L10.3 9.8" />
      </svg>
    </button>
  )
}
