import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFriendship } from '../../hooks/useFriendship';
import { SOCIAL_CONFIG } from '../../content/social';
import {
  IconUserPlus,
  IconUserCheck,
  IconClose,
  IconUsers,
  IconChevronDown
} from '../icons';
import './FriendButton.css';

/**
 * frontend/src/components/social/FriendButton.jsx
 *
 * Profile action control:
 * - Other users: Add friend / Pending / Accept & Decline / Friends (with Unfriend & Block menu)
 * - Own profile: Shortcut links to Friends, Requests, and Social Privacy
 */
export default function FriendButton({ targetUserId, targetUsername, isMe = false }) {
  const {
    relation,
    mutualCount,
    actionInProgress,
    sendRequest,
    accept,
    decline,
    cancel,
    unfriend,
    block
  } = useFriendship(targetUserId, targetUsername);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  if (isMe) {
    return (
      <div className="friend-self-links">
        <Link to={`/profile/${encodeURIComponent(targetUsername || '')}/friends`} className="friend-self-link">
          <IconUsers size={16} />
          <span>Friends</span>
        </Link>
        <Link to="/profile/requests" className="friend-self-link">
          <IconUserPlus size={16} />
          <span>Requests</span>
        </Link>
        <Link to="/profile/privacy" className="friend-self-link">
          <span>Privacy</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`friend-button-wrapper ${menuOpen ? 'menu-active' : ''}`} ref={menuRef}>
      {relation === 'friends' ? (
        <div className="friend-status-group">
          <button
            type="button"
            className="friend-btn friend-btn-connected"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            disabled={actionInProgress}
          >
            <IconUserCheck size={18} />
            <span>{SOCIAL_CONFIG.copy.friends}</span>
            <IconChevronDown size={14} className="friend-chevron" />
          </button>

          {menuOpen && (
            <div className="friend-dropdown-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="friend-dropdown-item text-rose-400"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm(SOCIAL_CONFIG.copy.unfriendConfirm)) {
                    unfriend();
                  }
                }}
              >
                {SOCIAL_CONFIG.copy.unfriend}
              </button>
              <button
                type="button"
                role="menuitem"
                className="friend-dropdown-item text-rose-400"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm(SOCIAL_CONFIG.copy.blockConfirm)) {
                    block();
                  }
                }}
              >
                {SOCIAL_CONFIG.copy.block}
              </button>
            </div>
          )}
        </div>
      ) : relation === 'pending_out' ? (
        <div className="friend-status-group">
          <button
            type="button"
            className="friend-btn friend-btn-pending"
            onClick={cancel}
            disabled={actionInProgress}
            title="Click to cancel outgoing request"
          >
            <IconUserCheck size={16} />
            <span>{actionInProgress ? 'Cancelling...' : 'Request sent'}</span>
            <span className="friend-cancel-hint">(Cancel)</span>
          </button>
        </div>
      ) : relation === 'pending_in' ? (
        <div className="friend-incoming-actions">
          <button
            type="button"
            className="friend-btn friend-btn-accept"
            onClick={accept}
            disabled={actionInProgress}
          >
            {actionInProgress ? '...' : SOCIAL_CONFIG.copy.accept}
          </button>
          <button
            type="button"
            className="friend-btn friend-btn-decline"
            onClick={decline}
            disabled={actionInProgress}
          >
            {SOCIAL_CONFIG.copy.decline}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="friend-btn friend-btn-add"
          onClick={sendRequest}
          disabled={actionInProgress}
        >
          <IconUserPlus size={16} />
          <span>{actionInProgress ? SOCIAL_CONFIG.copy.sending : '+ Add friend'}</span>
        </button>
      )}
    </div>
  );
}

