import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest
} from '../../services/socialApi';
import { getUserAvatarUrl } from '../../utils/avatar';
import { SOCIAL_CONFIG } from '../../content/social';
import { IconUserPlus, IconUserCheck } from '../../components/icons';
import './FriendRequestsView.css';

function formatRequestTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export default function FriendRequestsView() {
  const [tab, setTab] = useState('incoming'); // 'incoming' | 'outgoing'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState({});

  const fetchRequests = (direction) => {
    setLoading(true);
    getFriendRequests({ direction })
      .then(res => {
        setRequests(res.requests || res.items || []);
      })
      .catch(() => {
        setRequests([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests(tab);
  }, [tab]);

  const handleAccept = async (reqId) => {
    if (actionInProgress[reqId]) return;
    setActionInProgress(prev => ({ ...prev, [reqId]: true }));
    try {
      await acceptFriendRequest(reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch {
      // Retain on error
    } finally {
      setActionInProgress(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const handleDecline = async (reqId) => {
    if (actionInProgress[reqId]) return;
    setActionInProgress(prev => ({ ...prev, [reqId]: true }));
    try {
      await declineFriendRequest(reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch {
      // Retain on error
    } finally {
      setActionInProgress(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const handleCancel = async (reqId) => {
    if (actionInProgress[reqId]) return;
    setActionInProgress(prev => ({ ...prev, [reqId]: true }));
    try {
      await cancelFriendRequest(reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch {
      // Retain on error
    } finally {
      setActionInProgress(prev => ({ ...prev, [reqId]: false }));
    }
  };

  return (
    <div className="requests-view-container">
      <div className="requests-header">
        <h1 className="requests-title">Friend Requests</h1>
        <p className="requests-subtitle">
          Manage incoming and pending friend invitations.
        </p>
      </div>

      <div className="requests-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'incoming'}
          className={`requests-tab-btn ${tab === 'incoming' ? 'is-active' : ''}`}
          onClick={() => setTab('incoming')}
        >
          Incoming
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'outgoing'}
          className={`requests-tab-btn ${tab === 'outgoing' ? 'is-active' : ''}`}
          onClick={() => setTab('outgoing')}
        >
          Outgoing
        </button>
      </div>

      <div className="requests-list-card">
        {loading ? (
          <div style={{ padding: '24px 20px' }}>
            <div className="notif-skeleton-row" />
            <div className="notif-skeleton-row" />
          </div>
        ) : requests.length === 0 ? (
          <div className="requests-empty-state">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3">
              <IconUserPlus size={22} className="text-zinc-400" />
            </div>
            <p className="font-medium text-white mb-1">
              {tab === 'incoming' ? 'No incoming friend requests' : 'No pending outgoing requests'}
            </p>
            <p className="text-xs text-zinc-400">
              {tab === 'incoming'
                ? 'When another player adds you as a friend, their invitation will appear here.'
                : 'Explore leaderboards or match results to connect with other players.'}
            </p>
          </div>
        ) : (
          requests.map(req => {
            const otherUser = req.user || (tab === 'incoming' ? req.requester : req.target) || {};
            const otherUsername = otherUser.username || 'player';
            const avatarUrl = getUserAvatarUrl(otherUsername, otherUser.avatar_seed || otherUser.avatarSeed, otherUser.avatar_style || otherUser.avatarStyle);
            const isBusy = actionInProgress[req.id];

            return (
              <div key={req.id} className="requests-row">
                <div className="requests-user-info">
                  <div className="requests-avatar">
                    <img
                      src={avatarUrl}
                      alt=""
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="requests-user-meta">
                    <Link to={`/profile/${encodeURIComponent(otherUsername)}`} className="requests-name">
                      {otherUsername}
                    </Link>
                    <span className="requests-time">
                      Sent {formatRequestTime(req.created_at || req.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="requests-actions">
                  {tab === 'incoming' ? (
                    <>
                      <button
                        type="button"
                        className="requests-btn-accept"
                        disabled={isBusy}
                        onClick={() => handleAccept(req.id)}
                      >
                        {isBusy ? 'Saving...' : SOCIAL_CONFIG.copy.accept}
                      </button>
                      <button
                        type="button"
                        className="requests-btn-decline"
                        disabled={isBusy}
                        onClick={() => handleDecline(req.id)}
                      >
                        {SOCIAL_CONFIG.copy.decline}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="requests-btn-cancel"
                      disabled={isBusy}
                      onClick={() => handleCancel(req.id)}
                    >
                      {isBusy ? 'Cancelling...' : SOCIAL_CONFIG.copy.cancelRequest}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

