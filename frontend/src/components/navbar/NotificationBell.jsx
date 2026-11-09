import React from 'react';
import { IconBell } from '../icons';

/**
 * frontend/src/components/navbar/NotificationBell.jsx
 *
 * Primary Bell button for desktop and mobile navbar.
 * - Desktop: 40px hit area, 20px custom stroke icon
 * - Mobile: 44px hit area
 * - Badge: Ink on --info surface, capped at 99+, hidden at 0
 * - Accessible aria attributes
 */
export default function NotificationBell({
  id = 'nav-notif-btn',
  unreadCount = 0,
  isOpen = false,
  onClick,
  buttonRef,
  isMobile = false
}) {
  const displayCount = unreadCount > 99 ? '99+' : unreadCount;
  const ariaLabel = unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : 'Notifications';

  return (
    <button
      ref={buttonRef}
      id={id}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls="nav-notif-panel"
      className={`nav-v2-bell-btn ${isMobile ? 'is-mobile' : ''} ${isOpen ? 'is-open' : ''}`}
      style={{
        position: 'relative',
        width: isMobile ? '44px' : '40px',
        height: isMobile ? '44px' : '40px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isOpen ? 'var(--bg-2, rgba(255, 255, 255, 0.08))' : 'transparent',
        border: '1px solid',
        borderColor: isOpen ? 'var(--hair-muted, rgba(196, 214, 232, 0.24))' : 'transparent',
        borderRadius: '8px',
        color: isOpen ? 'var(--ink, #ffffff)' : 'var(--sub, #a2a9b8)',
        cursor: 'pointer',
        padding: 0,
        margin: 0,
        transition: 'color 0.15s, background-color 0.15s, border-color 0.15s'
      }}
      onMouseOver={e => {
        if (!isOpen) {
          e.currentTarget.style.color = 'var(--ink, #ffffff)';
          e.currentTarget.style.background = 'var(--bg-1, rgba(255, 255, 255, 0.04))';
        }
      }}
      onMouseOut={e => {
        if (!isOpen) {
          e.currentTarget.style.color = 'var(--sub, #a2a9b8)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <IconBell size={20} />

      {unreadCount > 0 && (
        <span
          className="nav-v2-bell-badge"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '8px',
            backgroundColor: 'var(--info, #38bdf8)',
            color: '#02060f',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '10px',
            fontWeight: 700,
            lineHeight: '16px',
            textAlign: 'center',
            pointerEvents: 'none',
            boxSizing: 'border-box'
          }}
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}

