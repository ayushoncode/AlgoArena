import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserFriends } from '../../services/socialApi';
import { getUserAvatarUrl } from '../../utils/avatar';
import { getTierForRating } from '../../lib/tiers';
import { IconUsers, IconUserPlus, IconArrowRight, IconLock } from '../../components/icons';
import './ProfileFriendsSection.css';

/**
 * ProfileFriendsSection — Dedicated Friends module on the profile page
 * Displays preview cards of friends, count, and direct links to
 * friends list, friend requests, and leaderboard.
 */
export default function ProfileFriendsSection({ username, isMe = false, targetUserId = null }) {
  const [friends, setFriends] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let active = true;
    setLoading(true);

    getUserFriends(username, { limit: 6 })
      .then(res => {
        if (!active) return;
        if (res.isPrivate) {
          setIsPrivate(true);
          setFriends([]);
          setTotalCount(0);
        } else {
          setIsPrivate(false);
          const friendsList = res.friends || res.items || [];
          const count = res.totalCount ?? res.count ?? friendsList.length;
          setFriends(friendsList);
          setTotalCount(count);
        }
      })
      .catch(() => {
        if (!active) return;
        setFriends([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [username]);

  return (
    <section className="profile-friends-card" aria-label="Friends and Connections">
      <div className="p-friends-header">
        <div className="p-friends-title-wrap">
          <IconUsers size={18} className="text-sky-400" />
          <h2 className="p-friends-title">{isMe ? 'Your Friends' : 'Friends'}</h2>
          {!isPrivate && (
            <span className="p-friends-count-badge">{totalCount}</span>
          )}
        </div>

        <div className="p-friends-header-links">
          {isMe && (
            <Link to="/profile/requests" className="p-friends-link-btn">
              <IconUserPlus size={14} />
              <span>Requests</span>
            </Link>
          )}
          {!isPrivate && totalCount > 0 && (
            <Link to={`/profile/${encodeURIComponent(username)}/friends`} className="p-friends-link-btn">
              <span>View all</span>
              <IconArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--sub, #a2a9b8)', fontFamily: 'var(--font-mono, monospace)' }}>
            Loading connections...
          </span>
        </div>
      ) : isPrivate ? (
        <div className="p-friends-empty">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 mb-2">
            <IconLock size={16} className="text-zinc-400" />
          </div>
          <p className="p-friends-empty-text">
            {username} keeps their friends list private.
          </p>
        </div>
      ) : friends.length === 0 ? (
        <div className="p-friends-empty">
          <p className="p-friends-empty-text">
            {isMe
              ? "You have not added any friends yet. Connect with other duellists from the leaderboard."
              : `${username} has no public friends to show.`}
          </p>
          {isMe && (
            <div className="p-friends-empty-actions">
              <Link to="/leaderboard" className="p-friends-action-btn p-friends-action-primary">
                Find players on Leaderboard
              </Link>
              <Link to="/profile/requests" className="p-friends-action-btn p-friends-action-secondary">
                Check Friend Requests
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="p-friends-grid">
          {friends.map(friend => {
            const avatarUrl = getUserAvatarUrl(friend.username, friend.avatar_seed, friend.avatar_style);
            const tier = getTierForRating(friend.elo_rating || 1200);
            const TierMark = tier.Mark;

            return (
              <Link
                key={friend.id}
                to={`/profile/${encodeURIComponent(friend.username)}`}
                className="p-friend-item"
              >
                <div className="p-friend-avatar">
                  <img
                    src={avatarUrl}
                    alt=""
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="p-friend-meta">
                  <span className="p-friend-name" title={friend.username}>
                    {friend.username}
                  </span>
                  <div className="p-friend-sub">
                    <span className="p-friend-rating">{friend.elo_rating ?? 1200}</span>
                    <span className="p-friend-tier" style={{ color: tier.color, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <TierMark size={10} />
                      <span>{tier.name}</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

