import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDiscussionRooms, getMyThreads } from '../../services/discussionApi';
import { DISCUSSION_CONFIG } from '../../content/discussion';
import { formatRelativeTime, getDifficultyColor } from '../../utils/discussionFormatters';
import { IconSearch } from '../../components/icons';
import { useAuth } from '../../hooks/useAuth';
import './DiscussionIndex.css';

export default function DiscussionIndex() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'mine'
  const [rooms, setRooms] = useState([]);
  const [myThreads, setMyThreads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);
    setError(null);

    if (activeTab === 'active') {
      getDiscussionRooms()
        .then(data => {
          if (isSubscribed) {
            setRooms(data.rooms || []);
            setLoading(false);
          }
        })
        .catch(err => {
          if (isSubscribed) {
            setError(err.message || DISCUSSION_CONFIG.copy.errorRetry);
            setLoading(false);
          }
        });
    } else {
      getMyThreads()
        .then(data => {
          if (isSubscribed) {
            setMyThreads(data.threads || []);
            setLoading(false);
          }
        })
        .catch(err => {
          if (isSubscribed) {
            setError(err.message || DISCUSSION_CONFIG.copy.errorRetry);
            setLoading(false);
          }
        });
    }

    return () => {
      isSubscribed = false;
    };
  }, [activeTab]);

  const filteredRooms = rooms.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.problemTitle?.toLowerCase().includes(q) ||
      r.problemTopic?.toLowerCase().includes(q) ||
      r.problemSlug?.toLowerCase().includes(q)
    );
  });

  const filteredMyThreads = myThreads.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.problem_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="disc-index-container">
      <h1 className="disc-header-title">{DISCUSSION_CONFIG.copy.indexTitle}</h1>
      <p className="disc-header-subtitle">{DISCUSSION_CONFIG.copy.indexSubtitle}</p>

      {/* Tabs */}
      <div className="disc-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'active'}
          className={`disc-tab-btn ${activeTab === 'active' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        {isAuthenticated && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mine'}
            className={`disc-tab-btn ${activeTab === 'mine' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            My threads
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="disc-search-box">
        <IconSearch size={18} className="text-zinc-400" />
        <input
          type="text"
          className="disc-search-input"
          placeholder={activeTab === 'active' ? "Filter problems by title or topic..." : "Search your threads..."}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="text-xs text-zinc-400 hover:text-zinc-200"
            onClick={() => setSearchQuery('')}
          >
            Clear
          </button>
        )}
      </div>

      {/* Error Retry State */}
      {error && (
        <div className="p-4 mb-6 rounded border border-rose-900/40 bg-rose-950/20 text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            className="px-3 py-1 rounded bg-rose-900/40 hover:bg-rose-900/60 text-xs text-rose-100 font-medium"
            onClick={() => {
              setLoading(true);
              setError(null);
              getDiscussionRooms()
                .then(d => { setRooms(d.rooms || []); setLoading(false); })
                .catch(e => { setError(e.message); setLoading(false); });
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Content List */}
      <div className="disc-room-list">
        {loading ? (
          <div>
            <div className="disc-skeleton-row" />
            <div className="disc-skeleton-row" />
            <div className="disc-skeleton-row" />
            <div className="disc-skeleton-row" />
            <div className="disc-skeleton-row" />
          </div>
        ) : activeTab === 'active' ? (
          filteredRooms.length === 0 ? (
            <div className="disc-empty-state">
              {searchQuery ? 'No matching discussion rooms found.' : DISCUSSION_CONFIG.copy.emptyRooms}
            </div>
          ) : (
            filteredRooms.map(room => {
            const title = room.problemTitle || room.title || 'Untitled Problem';
            const slug = room.problemSlug || room.slug || '';
            const topic = room.problemTopic || room.topic || 'General';
            const difficulty = room.problemDifficulty || room.difficulty || 'medium';

            return (
              <Link
                key={room.roomId || room.problemId}
                to={`/discuss/${slug}`}
                className="disc-room-row"
              >
                <div className="disc-room-title">{title}</div>
                <div className="disc-room-topic-diff">
                  <span>{topic}</span>
                  <span>•</span>
                  <span className={getDifficultyColor(difficulty)}>
                    {difficulty}
                  </span>
                </div>
                <div className="disc-room-threads">
                  {room.threadCount} {room.threadCount === 1 ? 'thread' : 'threads'}
                </div>
                <div className="disc-room-activity">
                  {formatRelativeTime(room.lastActivityAt)}
                </div>
              </Link>
            );
          })
          )
        ) : (
          filteredMyThreads.length === 0 ? (
            <div className="disc-empty-state">
              You haven't posted any threads yet.
            </div>
          ) : (
            filteredMyThreads.map(thread => (
              <Link
                key={thread.id}
                to={`/discuss/${thread.problem_slug}/thread/${thread.id}`}
                className="disc-room-row"
              >
                <div className="disc-room-title font-medium text-white">{thread.title}</div>
                <div className="disc-room-topic-diff">
                  <span>{thread.problem_title}</span>
                </div>
                <div className="disc-room-threads">
                  {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                </div>
                <div className="disc-room-activity">
                  {formatRelativeTime(thread.created_at)}
                </div>
              </Link>
            ))
          )
        )}
      </div>
    </div>
  );
}
