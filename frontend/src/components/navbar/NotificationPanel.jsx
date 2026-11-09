import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserAvatarUrl, UserAvatar } from '../../utils/avatar';
import { SOCIAL_CONFIG } from '../../content/social';
import {
  acceptFriendRequest,
  declineFriendRequest
} from '../../services/socialApi';
import { IconClose } from '../icons';
import './NotificationPanel.css';

function formatNotificationTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d`;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  triggerRef,
  notifications = [],
  loading = false,
  activeTab = 'all',
  onTabChange,
  onMarkRead,
  onMarkAllRead,
  isMobile = false
}) {
  const panelRef = useRef(null);
  const [actionStates, setActionStates] = useState({}); // { [entityId]: 'accepted' | 'declined' | 'processing' }

  // Handle outside click on desktop
  useEffect(() => {
    if (!isOpen || isMobile) return;

    function handleMouseDown(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, isMobile, onClose, triggerRef]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'requests') {
      return n.type === 'friend_request';
    }
    return true;
  });

  const handleAcceptRequest = async (notif) => {
    const friendshipId = notif.entityId || notif.entity_id;
    if (!friendshipId || actionStates[friendshipId]) return;

    setActionStates(prev => ({ ...prev, [friendshipId]: 'processing' }));
    try {
      await acceptFriendRequest(friendshipId);
      notif.status = 'accepted';
      notif.entityStatus = 'accepted';
      setActionStates(prev => ({ ...prev, [friendshipId]: 'accepted' }));
      onMarkRead?.(notif.id);
    } catch {
      setActionStates(prev => ({ ...prev, [friendshipId]: null }));
    }
  };

  const handleDeclineRequest = async (notif) => {
    const friendshipId = notif.entityId || notif.entity_id;
    if (!friendshipId || actionStates[friendshipId]) return;

    setActionStates(prev => ({ ...prev, [friendshipId]: 'processing' }));
    try {
      await declineFriendRequest(friendshipId);
      notif.status = 'declined';
      notif.entityStatus = 'declined';
      setActionStates(prev => ({ ...prev, [friendshipId]: 'declined' }));
      onMarkRead?.(notif.id);
    } catch {
      setActionStates(prev => ({ ...prev, [friendshipId]: null }));
    }
  };

  const renderContentText = (notif) => {
    const actorName = notif.actor?.username || notif.actor_username || 'A player';
    if (notif.type === 'friend_request') {
      return (
        <>
          <span className="notif-text-strong">{actorName}</span> sent you a friend request.
        </>
      );
    }
    if (notif.type === 'friend_accepted') {
      return (
        <>
          <span className="notif-text-strong">{actorName}</span> accepted your friend request.
        </>
      );
    }
    if (notif.type === 'discussion_reply') {
      return (
        <>
          <span className="notif-text-strong">{actorName}</span> replied to your discussion thread.
        </>
      );
    }
    return (
      <>
        <span className="notif-text-strong">{actorName}</span> sent an update.
      </>
    );
  };

  return (
    <div
      ref={panelRef}
      id="nav-notif-panel"
      role="dialog"
      aria-label={SOCIAL_CONFIG.copy.notificationCenterTitle}
      aria-modal={isMobile}
      className={isMobile ? 'notif-mobile-sheet' : 'notif-panel-popover'}
    >
      {/* Header */}
      <div className="notif-panel-header">
        <h2 className="notif-panel-title">{SOCIAL_CONFIG.copy.notificationCenterTitle}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="notif-panel-mark-btn"
            onClick={onMarkAllRead}
          >
            {SOCIAL_CONFIG.copy.markAllRead}
          </button>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sub, #a2a9b8)',
                cursor: 'pointer',
                padding: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconClose size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="notif-panel-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`notif-tab-item ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => onTabChange?.('all')}
        >
          All
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'requests'}
          className={`notif-tab-item ${activeTab === 'requests' ? 'is-active' : ''}`}
          onClick={() => onTabChange?.('requests')}
        >
          Requests
        </button>
      </div>

      {/* List */}
      <ul className="notif-panel-list" role="list">
        {loading && notifications.length === 0 ? (
          <>
            <li className="notif-skeleton-row" />
            <li className="notif-skeleton-row" />
            <li className="notif-skeleton-row" />
          </>
        ) : filteredNotifications.length === 0 ? (
          <li className="notif-empty">
            {SOCIAL_CONFIG.copy.allCaughtUp}
          </li>
        ) : (
          filteredNotifications.map(notif => {
            const isUnread = !(notif.readAt || notif.read_at);
            const actorName = notif.actor?.username || notif.actor_username || 'user';
            const actorSeed = notif.actor?.avatarSeed || notif.actor_avatar_seed;
            const actorStyle = notif.actor?.avatarStyle || notif.actor_avatar_style;
            const actorAvatar = getUserAvatarUrl(actorName, actorSeed, actorStyle);
            const initial = (actorName[0] || 'U').toUpperCase();
            const friendshipId = notif.entityId || notif.entity_id;
            const actionState = actionStates[friendshipId] || notif.status || notif.entityStatus || notif.entity_status;

            return (
              <li
                key={notif.id}
                className={`notif-row ${isUnread ? 'is-unread' : ''}`}
                onClick={() => {
                  if (isUnread) onMarkRead?.(notif.id);
                }}
              >
                <UserAvatar
                  username={actorName}
                  seed={actorSeed}
                  style={actorStyle}
                  size={34}
                />

                <div className="notif-content">
                  <p className="notif-text">
                    {renderContentText(notif)}
                  </p>

                  <div className="notif-meta-line">
                    <span>{formatNotificationTime(notif.createdAt || notif.created_at)}</span>
                    {isUnread && <span className="notif-unread-dot" aria-label="Unread" />}
                  </div>

                  {notif.type === 'friend_request' && (
                    <div className="notif-actions" onClick={e => e.stopPropagation()}>
                      {actionState === 'accepted' ? (
                        <span className="notif-status-badge notif-status-accepted">Accepted</span>
                      ) : actionState === 'declined' ? (
                        <span className="notif-status-badge notif-status-declined">Declined</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="notif-btn-accept"
                            disabled={actionState === 'processing'}
                            onClick={() => handleAcceptRequest(notif)}
                          >
                            {actionState === 'processing' ? 'Saving...' : SOCIAL_CONFIG.copy.accept}
                          </button>
                          <button
                            type="button"
                            className="notif-btn-decline"
                            disabled={actionState === 'processing'}
                            onClick={() => handleDeclineRequest(notif)}
                          >
                            {SOCIAL_CONFIG.copy.decline}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* Footer */}
      <div className="notif-panel-footer">
        <Link
          to="/profile/requests"
          className="notif-footer-link"
          onClick={onClose}
        >
          View all requests
        </Link>
      </div>
    </div>
  );
}

