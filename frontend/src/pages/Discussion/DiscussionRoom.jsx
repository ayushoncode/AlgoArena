import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDiscussionRoom, createThread } from '../../services/discussionApi';
import { DISCUSSION_CONFIG } from '../../content/discussion';
import { useDiscussionRoom } from '../../hooks/useDiscussionRoom';
import { SafeMarkdown } from '../../utils/markdown';
import { formatRelativeTime, getDifficultyColor, getTypeBadgeStyle } from '../../utils/discussionFormatters';
import { getUserAvatarUrl } from '../../utils/avatar';
import {
  IconSearch,
  IconPlus,
  IconClose,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconLock
} from '../../components/icons';
import PremiumBadge from '../../components/PremiumBadge';
import { useAuth } from '../../hooks/useAuth';
import { usePremium } from '../../hooks/usePremium';
import './DiscussionRoom.css';

export default function DiscussionRoom() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isPremium, isPremiumEnabled, openLockedModal } = usePremium();

  const [room, setRoom] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // Spoilers reveal state: Map of threadId -> boolean
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  // New Thread Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState('Question');
  const [composerTitle, setComposerTitle] = useState('');
  const [composerBody, setComposerBody] = useState('');
  const [composerTab, setComposerTab] = useState('write'); // 'write' | 'preview'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerError, setComposerError] = useState(null);
  const [autoSolutionAlert, setAutoSolutionAlert] = useState(false);

  // Socket Hook for Real-Time Updates & Match Lockout
  const {
    pendingCount,
    flushPendingThreads,
    isLockedInMatch: socketLocked
  } = useDiscussionRoom(slug);

  const fetchRoomData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDiscussionRoom(slug, {
        type: selectedType,
        sort: selectedSort,
        q: searchQuery
      });
      setRoom(data.room);
      setThreads(data.threads || []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'DISCUSSION_LOCKED_IN_MATCH') {
        setError('DISCUSSION_LOCKED_IN_MATCH');
      } else {
        setError(err.message || DISCUSSION_CONFIG.copy.errorRetry);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, selectedType, selectedSort, searchQuery]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!slug) return;
    const draftKey = `disc_draft_${slug}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title) setComposerTitle(parsed.title);
        if (parsed.body) setComposerBody(parsed.body);
        if (parsed.type) setComposerType(parsed.type);
      } catch {}
    }
  }, [slug]);

  // Autosave draft to localStorage
  useEffect(() => {
    if (!slug) return;
    const draftKey = `disc_draft_${slug}`;
    if (composerTitle || composerBody) {
      localStorage.setItem(draftKey, JSON.stringify({
        title: composerTitle,
        body: composerBody,
        type: composerType
      }));
    }
  }, [slug, composerTitle, composerBody, composerType]);

  const handleApplyPending = () => {
    const newThreads = flushPendingThreads();
    setThreads(prev => [...newThreads, ...prev]);
  };

  const toggleSpoiler = (id) => {
    setRevealedSpoilers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!composerTitle.trim() || !composerBody.trim()) {
      setComposerError('Title and body are required.');
      return;
    }

    setIsSubmitting(true);
    setComposerError(null);

    try {
      const res = await createThread({
        slug,
        type: composerType,
        title: composerTitle.trim(),
        body: composerBody.trim()
      });

      if (res.thread?.autoConvertedToSolution) {
        setAutoSolutionAlert(true);
      }

      // Prepend created thread to view
      setThreads(prev => [res.thread, ...prev]);
      setIsComposerOpen(false);
      setComposerTitle('');
      setComposerBody('');
      localStorage.removeItem(`disc_draft_${slug}`);
    } catch (err) {
      if (err.code === 'PREMIUM_REQUIRED' || err.response?.data?.code === 'PREMIUM_REQUIRED') {
        setIsComposerOpen(false);
        openLockedModal('discussion');
        return;
      }
      setComposerError(err.message || 'Failed to create thread.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error === 'DISCUSSION_LOCKED_IN_MATCH' || socketLocked) {
    return (
      <div className="disc-room-container">
        <div className="p-8 rounded-lg border border-amber-900/40 bg-amber-950/20 text-center max-w-xl mx-auto my-16">
          <div className="w-12 h-12 rounded-full bg-amber-900/40 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <IconLock size={24} />
          </div>
          <h2 className="text-xl font-bold text-amber-300 mb-2">
            {DISCUSSION_CONFIG.copy.matchLockedTitle}
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed mb-6">
            {DISCUSSION_CONFIG.copy.matchLockedDesc}
          </p>
          <Link
            to="/lobby"
            className="inline-flex px-5 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-semibold text-sm"
          >
            Return to Arena
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="disc-room-container">
      {/* Breadcrumb */}
      <div className="disc-breadcrumb">
        <Link to="/discuss">Discussions</Link>
        <IconChevronRight size={14} />
        <span className="text-zinc-200">{room?.title || slug}</span>
      </div>

      {/* Header */}
      <div className="disc-room-header">
        <div className="disc-header-meta">
          <div>
            <div className="disc-problem-title-bar">
              <h1 className="disc-problem-h1">{room?.title || slug}</h1>
              {room && (
                <span className={`text-sm font-medium ${getDifficultyColor(room.difficulty)}`}>
                  {room.difficulty}
                </span>
              )}
            </div>
            {room && (
              <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <span>{room.topic}</span>
                <span>•</span>
                <span>{room.threadCount} threads</span>
                {room.isDailyChallenge && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 flex items-center gap-1 font-mono">
                      Daily Challenge
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="disc-new-thread-btn flex items-center gap-1.5"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              if (isPremiumEnabled && !isPremium) {
                openLockedModal('discussion');
                return;
              }
              setIsComposerOpen(true);
            }}
          >
            <IconPlus size={16} />
            <span>New thread</span>
            {isPremiumEnabled && !isPremium && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 ml-1">
                <IconLock size={10} />
                <span>Premium</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Live Push Banner */}
      {pendingCount > 0 && (
        <div className="disc-live-banner" onClick={handleApplyPending}>
          {pendingCount} new {pendingCount === 1 ? 'post' : 'posts'} available. Click to show.
        </div>
      )}

      {/* Auto-solution alert banner if triggered */}
      {autoSolutionAlert && (
        <div className="p-3 mb-4 rounded border border-emerald-900/50 bg-emerald-950/20 text-emerald-300 text-xs flex items-center justify-between">
          <span>{DISCUSSION_CONFIG.copy.autoSolutionNotice}</span>
          <button
            type="button"
            className="text-emerald-400 hover:text-emerald-200"
            onClick={() => setAutoSolutionAlert(false)}
          >
            <IconClose size={14} />
          </button>
        </div>
      )}

      {/* Filter and Sort Bar */}
      <div className="disc-filter-bar">
        <div className="disc-type-pills">
          <button
            type="button"
            className={`disc-type-pill ${selectedType === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            All
          </button>
          {DISCUSSION_CONFIG.types.map(t => (
            <button
              key={t.id}
              type="button"
              className={`disc-type-pill ${selectedType === t.id ? 'is-active' : ''}`}
              onClick={() => setSelectedType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-white/10 text-xs">
            <IconSearch size={14} className="text-zinc-400" />
            <input
              type="text"
              placeholder="Search posts..."
              className="bg-transparent border-none outline-none text-white text-xs w-28 sm:w-40 placeholder:text-zinc-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="text-zinc-500 hover:text-zinc-300"
                onClick={() => setSearchQuery('')}
              >
                <IconClose size={12} />
              </button>
            )}
          </div>

          <select
            className="disc-sort-select"
            value={selectedSort}
            onChange={e => setSelectedSort(e.target.value)}
          >
            {DISCUSSION_CONFIG.sortOptions.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Thread List */}
      {loading ? (
        <div className="space-y-3">
          <div className="disc-skeleton-row rounded" />
          <div className="disc-skeleton-row rounded" />
          <div className="disc-skeleton-row rounded" />
        </div>
      ) : threads.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 text-sm border border-white/5 rounded-lg bg-zinc-900/30">
          {DISCUSSION_CONFIG.copy.emptyThreads}
        </div>
      ) : (
        <div>
          {threads.map(t => {
            const isSpoiler = Boolean(t.isSpoiler);
            const isRevealed = Boolean(revealedSpoilers[t.id]);
            const badgeStyle = getTypeBadgeStyle(t.type);
            const author = t.author || {};
            const avatarUrl = getUserAvatarUrl(author.username, author.avatarSeed, author.avatarStyle);

            return (
              <div key={t.id} className="disc-thread-card">
                <div className="disc-thread-header">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border uppercase"
                      style={{
                        background: badgeStyle.bg,
                        borderColor: badgeStyle.border,
                        color: badgeStyle.text
                      }}
                    >
                      {t.type}
                    </span>

                    <Link
                      to={`/discuss/${slug}/thread/${t.id}`}
                      className="disc-thread-title-link"
                    >
                      {t.title}
                    </Link>
                  </div>

                  <div className="text-xs font-mono text-zinc-400 flex items-center gap-3">
                    <span>{t.replyCount || 0} replies</span>
                    <span>{t.helpfulCount || 0} helpful</span>
                  </div>
                </div>

                {/* Body or Spoiler Box */}
                {t.isDailyHidden ? (
                  <div className="disc-spoiler-box text-xs text-amber-300">
                    {DISCUSSION_CONFIG.copy.dailyHiddenDesc}
                  </div>
                ) : isSpoiler && !isRevealed ? (
                  <div className="disc-spoiler-box flex items-center justify-between">
                    <span className="text-xs text-amber-300">
                      This post may contain solution code or approach spoilers.
                    </span>
                    <button
                      type="button"
                      className="disc-spoiler-btn"
                      onClick={() => toggleSpoiler(t.id)}
                    >
                      <IconChevronDown size={14} />
                      <span>{DISCUSSION_CONFIG.copy.showSolutionButton}</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    {isSpoiler && isRevealed && (
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          className="disc-spoiler-btn text-xs"
                          onClick={() => toggleSpoiler(t.id)}
                        >
                          <IconChevronUp size={14} />
                          <span>{DISCUSSION_CONFIG.copy.hideSolutionButton}</span>
                        </button>
                      </div>
                    )}
                    <SafeMarkdown content={t.body} />
                  </div>
                )}

                {/* Author Details Footer */}
                <div className="disc-author-row">
                  <img
                    src={avatarUrl}
                    alt={author.username || 'Author'}
                    className="disc-author-avatar"
                  />
                  <span className="font-medium text-zinc-300 text-xs">
                    {author.username || 'Warrior'}
                  </span>
                  {author.isPremium && <PremiumBadge size="xs" showLabel={false} />}
                  <span className="text-zinc-500 font-mono text-xs">
                    {author.eloRating || 1200}
                  </span>
                  <span>•</span>
                  <span className="text-zinc-500 text-xs">
                    {formatRelativeTime(t.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Thread Composer Modal */}
      {isComposerOpen && (
        <div className="disc-modal-overlay">
          <div className="disc-modal-dialog">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
              <h3 className="font-semibold text-white text-base">New Thread</h3>
              <button
                type="button"
                className="text-zinc-400 hover:text-white"
                onClick={() => setIsComposerOpen(false)}
              >
                <IconClose size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4">
              {composerError && (
                <div className="p-3 text-xs rounded border border-rose-900/50 bg-rose-950/30 text-rose-300">
                  {composerError}
                </div>
              )}

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DISCUSSION_CONFIG.types.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                        composerType === t.id
                          ? 'border-sky-500 bg-sky-950/30 text-white'
                          : 'border-white/10 bg-zinc-900/40 text-zinc-400 hover:border-white/20'
                      }`}
                      onClick={() => setComposerType(t.id)}
                    >
                      <div className="font-semibold mb-0.5">{t.label}</div>
                      <div className="text-[11px] text-zinc-400 line-clamp-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-zinc-300">Title</label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {composerTitle.length}/{DISCUSSION_CONFIG.maxTitleLength}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={DISCUSSION_CONFIG.maxTitleLength}
                  placeholder="Summarize your question or insight in one sentence"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900/80 border border-white/10 text-white text-sm outline-none focus:border-sky-500"
                  value={composerTitle}
                  onChange={e => setComposerTitle(e.target.value)}
                />
              </div>

              {/* Body Composer with Write/Preview Tabs */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`text-xs px-2.5 py-1 rounded ${
                        composerTab === 'write' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
                      }`}
                      onClick={() => setComposerTab('write')}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      className={`text-xs px-2.5 py-1 rounded ${
                        composerTab === 'preview' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
                      }`}
                      onClick={() => setComposerTab('preview')}
                    >
                      Preview
                    </button>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {composerBody.length}/{DISCUSSION_CONFIG.maxThreadBodyLength}
                  </span>
                </div>

                {composerTab === 'write' ? (
                  <textarea
                    rows={8}
                    maxLength={DISCUSSION_CONFIG.maxThreadBodyLength}
                    placeholder="Write in markdown. Fenced code blocks with ``` supported."
                    className="w-full p-3.5 rounded-lg bg-zinc-900/80 border border-white/10 text-white text-sm font-mono outline-none focus:border-sky-500 leading-relaxed resize-y"
                    value={composerBody}
                    onChange={e => setComposerBody(e.target.value)}
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-zinc-900/80 border border-white/10 min-h-[190px]">
                    {composerBody.trim() ? (
                      <SafeMarkdown content={composerBody} />
                    ) : (
                      <span className="text-zinc-500 text-xs italic">Nothing to preview</span>
                    )}
                  </div>
                )}
                <div className="text-[11px] text-zinc-500 mt-1">
                  Code blocks longer than 5 lines are categorized as Solutions automatically.
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded text-xs text-zinc-400 hover:text-white font-medium"
                  onClick={() => setIsComposerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !composerTitle.trim() || !composerBody.trim()}
                  className="px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {isSubmitting ? DISCUSSION_CONFIG.copy.postPending : 'Publish Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
