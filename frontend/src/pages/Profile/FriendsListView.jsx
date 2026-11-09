import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserFriends } from '../../services/socialApi';
import { getUserAvatarUrl } from '../../utils/avatar';
import { getTierForRating } from '../../lib/tiers';
import PremiumBadge from '../../components/PremiumBadge';
import FriendButton from '../../components/social/FriendButton';
import { IconSearch, IconUsers, IconLock } from '../../components/icons';
import { SOCIAL_CONFIG } from '../../content/social';
import './FriendsListView.css';

/**
 * frontend/src/pages/Profile/FriendsListView.jsx
 *
 * Paginated and searchable view of a player's friends list.
 * Respects strict privacy rules:
 * - Hidden if private to non-authorized viewer
 * - Zero display of institute, email, online_status, or last_seen
 */
export default function FriendsListView() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [nextCursor, setNextCursor] = useState(null);

  const isMe = currentUser && (currentUser.username?.toLowerCase() === username?.toLowerCase());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setIsPrivate(false);

    getUserFriends(username, { q: searchQ })
      .then(res => {
        if (!active) return;
        if (res.isPrivate) {
          setIsPrivate(true);
          setFriends([]);
          setTotalCount(0);
        } else {
          const list = res.friends || res.items || [];
          const count = res.totalCount ?? res.count ?? list.length;
          setFriends(list);
          setTotalCount(count);
          setNextCursor(res.nextCursor || null);
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
  }, [username, searchQ]);

  return (
    <div className="friends-view-container">
      {/* Header bar */}
      <div className="friends-header-bar">
        <div className="friends-title-wrap">
          <h1 className="friends-title">
            {isMe ? 'Your Friends' : `Friends of ${username}`}
          </h1>
          <p className="friends-subtitle">
            {isPrivate
              ? 'Private connection list'
              : `${totalCount} ${totalCount === 1 ? 'connection' : 'connections'}`}
          </p>
        </div>

        {!isPrivate && (
          <div className="friends-search-box">
            <IconSearch size={18} className="text-zinc-400" />
            <input
              type="text"
              className="friends-search-input"
              placeholder="Search by username..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Friends Card */}
      <div className="friends-list-card">
        {loading ? (
          <div>
            <div className="friends-skeleton" />
            <div className="friends-skeleton" />
            <div className="friends-skeleton" />
            <div className="friends-skeleton" />
          </div>
        ) : isPrivate ? (
          <div className="friends-private-notice">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3">
              <IconLock size={22} className="text-zinc-400" />
            </div>
            <p className="font-semibold text-white mb-1">Friends list is private</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {username} {SOCIAL_CONFIG.copy.privateFriends}
            </p>
          </div>
        ) : friends.length === 0 ? (
          <div className="friends-empty-notice">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3">
              <IconUsers size={22} className="text-zinc-400" />
            </div>
            <p className="font-medium mb-1">
              {searchQ ? 'No matching friends found' : isMe ? SOCIAL_CONFIG.copy.noFriendsSelf : SOCIAL_CONFIG.copy.noFriendsOther}
            </p>
          </div>
        ) : (
          friends.map(friend => {
            const avatarUrl = getUserAvatarUrl(friend.username, friend.avatar_seed, friend.avatar_style);
            const tier = getTierForRating(friend.elo_rating || 1200);
            const TierMark = tier.Mark;
            const isFriendMe = currentUser && (currentUser.id === friend.id || String(currentUser.id) === String(friend.id));

            return (
              <div key={friend.id} className="friends-row">
                <div className="friends-user-info">
                  <div className="friends-avatar-wrap">
                    <img
                      src={avatarUrl}
                      alt=""
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div className="friends-name-tier">
                    <div className="friends-name-line">
                      <Link to={`/profile/${encodeURIComponent(friend.username)}`} className="friends-username-link">
                        {friend.username}
                      </Link>
                      {friend.is_premium && <PremiumBadge size="xs" showLabel={false} />}
                    </div>

                    <div className="friends-meta-line">
                      <span className="friends-rating">{friend.elo_rating ?? 1200}</span>
                      <span className="friends-tier-mark" style={{ color: tier.color }}>
                        <TierMark size={12} />
                        <span>{tier.name}</span>
                      </span>
                      {friend.mutual_count > 0 && !isMe && !isFriendMe && (
                        <span className="friends-mutual-badge">
                          {friend.mutual_count} mutual
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isFriendMe && (
                  <div className="friends-action-col">
                    <FriendButton
                      targetUserId={friend.id}
                      targetUsername={friend.username}
                      isMe={false}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

