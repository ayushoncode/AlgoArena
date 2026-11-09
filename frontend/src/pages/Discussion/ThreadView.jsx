import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getDiscussionThread,
  createReply,
  editThread,
  editReply,
  deleteThread,
  deleteReply,
  toggleVote,
  submitReport,
  blockUser
} from '../../services/discussionApi';
import { DISCUSSION_CONFIG } from '../../content/discussion';
import { useSocket } from '../../hooks/useSocket';
import { SafeMarkdown } from '../../utils/markdown';
import { formatRelativeTime, getTypeBadgeStyle } from '../../utils/discussionFormatters';
import { getUserAvatarUrl } from '../../utils/avatar';
import {
  IconChevronRight,
  IconThumbsUp,
  IconFlag,
  IconClose,
  IconQuote,
  IconEdit,
  IconTrash,
  IconLock,
  IconSend
} from '../../components/icons';
import PremiumBadge from '../../components/PremiumBadge';
import { useAuth } from '../../hooks/useAuth';
import { usePremium } from '../../hooks/usePremium';
import './ThreadView.css';

export default function ThreadView() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isPremium, isPremiumEnabled, openLockedModal } = usePremium();
  const { connected, emit, on, off } = useSocket();

  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reply Composer State
  const [replyBody, setReplyBody] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, username }
  const [composerTab, setComposerTab] = useState('write');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerError, setComposerError] = useState(null);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState(null); // { postKind, postId }
  const [reportCategory, setReportCategory] = useState(DISCUSSION_CONFIG.reportCategories[0]);
  const [reportNote, setReportNote] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Edit Modal State
  const [editTarget, setEditTarget] = useState(null); // { postKind, postId, initialBody, initialTitle }
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const composerRef = useRef(null);

  const fetchThreadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDiscussionThread(id);
      setThread(data.thread);
      setReplies(data.replies || []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'DISCUSSION_LOCKED_IN_MATCH') {
        setError('DISCUSSION_LOCKED_IN_MATCH');
      } else {
        setError(err.message || 'Failed to load thread.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchThreadData();
  }, [fetchThreadData]);

  // Join problem socket room for real-time reply updates
  useEffect(() => {
    if (!slug || !connected) return;

    emit('disc:join', { problemSlug: slug });

    function handleReplyCreated(data) {
      if (data?.reply && String(data.reply.threadId) === String(id)) {
        setReplies(prev => {
          if (prev.some(r => r.id === data.reply.id)) return prev;
          return [...prev, data.reply];
        });
      }
    }

    function handlePostUpdated(data) {
      if (data.postKind === 'thread' && data.postId === id) {
        setThread(prev => prev ? {
          ...prev,
          helpfulCount: data.helpfulCount !== undefined ? data.helpfulCount : prev.helpfulCount,
          title: data.title || prev.title,
          status: data.status || prev.status
        } : null);
      } else if (data.postKind === 'reply') {
        setReplies(prev => prev.map(r => {
          if (r.id === data.postId) {
            return {
              ...r,
              helpfulCount: data.helpfulCount !== undefined ? data.helpfulCount : r.helpfulCount,
              status: data.status || r.status
            };
          }
          return r;
        }));
      }
    }

    function handlePostHidden(data) {
      if (data.postKind === 'thread' && data.postId === id) {
        navigate(`/discuss/${slug}`);
      } else if (data.postKind === 'reply') {
        setReplies(prev => prev.filter(r => r.id !== data.postId));
      }
    }

    on('disc:reply_created', handleReplyCreated);
    on('disc:post_updated', handlePostUpdated);
    on('disc:post_hidden', handlePostHidden);

    return () => {
      off('disc:reply_created', handleReplyCreated);
      off('disc:post_updated', handlePostUpdated);
      off('disc:post_hidden', handlePostHidden);
    };
  }, [slug, id, connected, emit, on, off, navigate]);

  // Draft autosave for replies
  useEffect(() => {
    if (!id) return;
    const key = `disc_reply_draft_${id}`;
    const saved = localStorage.getItem(key);
    if (saved) setReplyBody(saved);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const key = `disc_reply_draft_${id}`;
    if (replyBody) {
      localStorage.setItem(key, replyBody);
    } else {
      localStorage.removeItem(key);
    }
  }, [id, replyBody]);

  const handleVote = async (postKind, postId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await toggleVote({ postKind, postId });
      if (postKind === 'thread') {
        setThread(prev => prev ? { ...prev, hasVoted: res.voted, helpfulCount: res.helpfulCount } : null);
      } else {
        setReplies(prev => prev.map(r => r.id === postId ? { ...r, hasVoted: res.voted, helpfulCount: res.helpfulCount } : r));
      }
    } catch (err) {
      console.error('[Vote error]', err.message);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isPremiumEnabled && !isPremium) {
      openLockedModal('discussion');
      return;
    }
    if (!replyBody.trim()) return;

    setIsSubmitting(true);
    setComposerError(null);

    try {
      const res = await createReply(id, {
        body: replyBody.trim(),
        replyToId: replyingTo?.id || null
      });

      setReplies(prev => [...prev, res.reply]);
      setReplyBody('');
      setReplyingTo(null);
      localStorage.removeItem(`disc_reply_draft_${id}`);
    } catch (err) {
      if (err.code === 'PREMIUM_REQUIRED' || err.response?.data?.code === 'PREMIUM_REQUIRED') {
        openLockedModal('discussion');
        return;
      }
      setComposerError(err.message || 'Failed to post reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportTarget) return;

    try {
      await submitReport({
        postKind: reportTarget.postKind,
        postId: reportTarget.postId,
        category: reportCategory,
        note: reportNote.trim()
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportTarget(null);
        setReportSuccess(false);
        setReportNote('');
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    }
  };

  const handleBlockUser = async (targetUserId) => {
    if (!window.confirm(DISCUSSION_CONFIG.copy.blockConfirm)) return;
    try {
      await blockUser(targetUserId);
      setReplies(prev => prev.filter(r => r.author?.id !== targetUserId));
    } catch (err) {
      alert(err.message || 'Failed to block user');
    }
  };

  const handleDeletePost = async (postKind, postId) => {
    if (!window.confirm(DISCUSSION_CONFIG.copy.deleteConfirm)) return;
    try {
      if (postKind === 'thread') {
        await deleteThread(postId);
        navigate(`/discuss/${slug}`);
      } else {
        await deleteReply(postId);
        setReplies(prev => prev.map(r => r.id === postId ? { ...r, status: 'deleted', body: '[deleted]' } : r));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsEditing(true);

    try {
      if (editTarget.postKind === 'thread') {
        const res = await editThread(editTarget.postId, {
          title: editTitle.trim(),
          body: editBody.trim()
        });
        setThread(prev => prev ? { ...prev, title: res.thread.title, body: res.thread.body } : null);
      } else {
        const res = await editReply(editTarget.postId, {
          body: editBody.trim()
        });
        setReplies(prev => prev.map(r => r.id === editTarget.postId ? { ...r, body: res.reply.body } : r));
      }
      setEditTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to edit post');
    } finally {
      setIsEditing(false);
    }
  };

  if (error === 'DISCUSSION_LOCKED_IN_MATCH') {
    return (
      <div className="disc-thread-container">
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

  if (loading) {
    return (
      <div className="disc-thread-container">
        <div className="disc-skeleton-row rounded my-4" />
        <div className="disc-skeleton-row rounded my-4 h-32" />
        <div className="disc-skeleton-row rounded my-4 h-24" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="disc-thread-container text-center py-16">
        <p className="text-zinc-400 mb-4">Thread not found or has been removed.</p>
        <Link to={`/discuss/${slug}`} className="text-sky-400 hover:underline text-sm">
          Return to problem room
        </Link>
      </div>
    );
  }

  const opAuthor = thread.author || {};
  const opAvatar = getUserAvatarUrl(opAuthor.username, opAuthor.avatarSeed, opAuthor.avatarStyle);
  const badgeStyle = getTypeBadgeStyle(thread.type);
  const isOwnOp = user?.id && String(user.id) === String(opAuthor.id);

  return (
    <div className="disc-thread-container">
      {/* Breadcrumb */}
      <div className="disc-breadcrumb">
        <Link to="/discuss">Discussions</Link>
        <IconChevronRight size={14} />
        <Link to={`/discuss/${slug}`}>{thread.problemTitle || slug}</Link>
        <IconChevronRight size={14} />
        <span className="text-zinc-200 line-clamp-1">{thread.title}</span>
      </div>

      {/* Original Thread Post */}
      <div className="disc-op-post">
        <div className="disc-op-header">
          <div className="flex items-center gap-2.5">
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border uppercase"
              style={{
                background: badgeStyle.bg,
                borderColor: badgeStyle.border,
                color: badgeStyle.text
              }}
            >
              {thread.type}
            </span>
            <div className="flex items-center gap-2">
              <img src={opAvatar} alt={opAuthor.username} className="disc-author-avatar" />
              <span className="font-medium text-zinc-300 text-xs">{opAuthor.username}</span>
              {opAuthor.isPremium && <PremiumBadge size="xs" showLabel={false} />}
              <span className="text-zinc-500 font-mono text-xs">{opAuthor.eloRating || 1200}</span>
              <span>•</span>
              <span className="text-zinc-500 text-xs">{formatRelativeTime(thread.createdAt)}</span>
            </div>
          </div>
        </div>

        <h1 className="disc-op-title">{thread.title}</h1>
        <SafeMarkdown content={thread.body} />

        {/* OP Actions Bar */}
        <div className="disc-actions-bar">
          <button
            type="button"
            className={`disc-vote-btn ${thread.hasVoted ? 'is-voted' : ''}`}
            onClick={() => handleVote('thread', thread.id)}
          >
            <IconThumbsUp size={14} filled={thread.hasVoted} />
            <span>Helpful ({thread.helpfulCount || 0})</span>
          </button>

          {isOwnOp ? (
            <>
              <button
                type="button"
                className="disc-action-text-btn flex items-center gap-1"
                onClick={() => {
                  setEditTarget({ postKind: 'thread', postId: thread.id, initialTitle: thread.title, initialBody: thread.body });
                  setEditTitle(thread.title);
                  setEditBody(thread.body);
                }}
              >
                <IconEdit size={13} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="disc-action-text-btn flex items-center gap-1 text-rose-400 hover:text-rose-300"
                onClick={() => handleDeletePost('thread', thread.id)}
              >
                <IconTrash size={13} />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="disc-action-text-btn flex items-center gap-1"
                onClick={() => setReportTarget({ postKind: 'thread', postId: thread.id })}
              >
                <IconFlag size={13} />
                <span>Report</span>
              </button>
              {opAuthor.id && (
                <button
                  type="button"
                  className="disc-action-text-btn"
                  onClick={() => handleBlockUser(opAuthor.id)}
                >
                  Block user
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Replies Timeline */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-200 mb-4">
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm border border-white/5 rounded-lg bg-zinc-900/20">
            No replies yet. Be the first to share your thoughts.
          </div>
        ) : (
          <div className="disc-replies-timeline">
            {replies.map(rep => {
              const repAuthor = rep.author || {};
              const repAvatar = getUserAvatarUrl(repAuthor.username, repAuthor.avatarSeed, repAuthor.avatarStyle);
              const isOwnReply = user?.id && String(user.id) === String(repAuthor.id);
              const isDeleted = rep.status === 'deleted';

              return (
                <div key={rep.id} className="disc-reply-item">
                  {/* Quote Parent Chip if replying to a specific post */}
                  {rep.replyToId && (
                    <div className="disc-quote-chip">
                      <IconQuote size={11} />
                      <span>In reply to earlier comment</span>
                    </div>
                  )}

                  {/* Reply Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img src={repAvatar} alt={repAuthor.username} className="disc-author-avatar" />
                      <span className="font-medium text-zinc-300 text-xs">{repAuthor.username}</span>
                      {repAuthor.isPremium && <PremiumBadge size="xs" showLabel={false} />}
                      <span className="text-zinc-500 font-mono text-xs">{repAuthor.eloRating || 1200}</span>
                      <span>•</span>
                      <span className="text-zinc-500 text-xs">{formatRelativeTime(rep.createdAt)}</span>
                    </div>
                  </div>

                  {/* Reply Content */}
                  <div className="text-sm">
                    {isDeleted ? (
                      <span className="text-zinc-500 italic">[deleted]</span>
                    ) : (
                      <SafeMarkdown content={rep.body} />
                    )}
                  </div>

                  {/* Reply Actions */}
                  {!isDeleted && (
                    <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-white/5">
                      <button
                        type="button"
                        className={`disc-vote-btn ${rep.hasVoted ? 'is-voted' : ''}`}
                        onClick={() => handleVote('reply', rep.id)}
                      >
                        <IconThumbsUp size={12} filled={rep.hasVoted} />
                        <span>Helpful ({rep.helpfulCount || 0})</span>
                      </button>

                      <button
                        type="button"
                        className="disc-action-text-btn flex items-center gap-1"
                        onClick={() => {
                          setReplyingTo({ id: rep.id, username: repAuthor.username });
                          composerRef.current?.focus();
                        }}
                      >
                        <IconQuote size={12} />
                        <span>Quote</span>
                      </button>

                      {isOwnReply ? (
                        <>
                          <button
                            type="button"
                            className="disc-action-text-btn flex items-center gap-1"
                            onClick={() => {
                              setEditTarget({ postKind: 'reply', postId: rep.id, initialBody: rep.body });
                              setEditBody(rep.body);
                            }}
                          >
                            <IconEdit size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="disc-action-text-btn flex items-center gap-1 text-rose-400 hover:text-rose-300"
                            onClick={() => handleDeletePost('reply', rep.id)}
                          >
                            <IconTrash size={12} />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="disc-action-text-btn flex items-center gap-1"
                            onClick={() => setReportTarget({ postKind: 'reply', postId: rep.id })}
                          >
                            <IconFlag size={12} />
                            <span>Report</span>
                          </button>
                          {repAuthor.id && (
                            <button
                              type="button"
                              className="disc-action-text-btn"
                              onClick={() => handleBlockUser(repAuthor.id)}
                            >
                              Block user
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pinned Bottom Composer */}
      <div className="disc-pinned-composer">
        <div className="disc-composer-inner">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded bg-zinc-800/80 border border-white/10 text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                <IconQuote size={12} />
                <span>Replying to <strong>@{replyingTo.username}</strong></span>
              </span>
              <button
                type="button"
                className="text-zinc-400 hover:text-white"
                onClick={() => setReplyingTo(null)}
              >
                <IconClose size={14} />
              </button>
            </div>
          )}

          {composerError && (
            <div className="mb-2 p-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 rounded">
              {composerError}
            </div>
          )}

          <form onSubmit={handleReplySubmit}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`text-xs px-2.5 py-0.5 rounded ${
                    composerTab === 'write' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
                  }`}
                  onClick={() => setComposerTab('write')}
                >
                  Write
                </button>
                <button
                  type="button"
                  className={`text-xs px-2.5 py-0.5 rounded ${
                    composerTab === 'preview' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
                  }`}
                  onClick={() => setComposerTab('preview')}
                >
                  Preview
                </button>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                {replyBody.length}/{DISCUSSION_CONFIG.maxReplyBodyLength}
              </span>
            </div>

            {composerTab === 'write' ? (
              <textarea
                ref={composerRef}
                rows={3}
                maxLength={DISCUSSION_CONFIG.maxReplyBodyLength}
                placeholder="Share your approach, hint, or follow-up question..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900/90 border border-white/10 text-white text-sm outline-none focus:border-sky-500 resize-none font-sans"
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
              />
            ) : (
              <div className="p-3 rounded-lg bg-zinc-900/90 border border-white/10 min-h-[75px] max-h-[140px] overflow-y-auto">
                {replyBody.trim() ? (
                  <SafeMarkdown content={replyBody} />
                ) : (
                  <span className="text-zinc-500 text-xs italic">Nothing to preview</span>
                )}
              </div>
            )}

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmitting || !replyBody.trim()}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <IconSend size={13} />
                <span>{isSubmitting ? 'Posting...' : 'Post Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <div className="disc-modal-overlay">
          <div className="disc-modal-dialog max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
              <h3 className="font-semibold text-white text-sm">Report Post</h3>
              <button
                type="button"
                className="text-zinc-400 hover:text-white"
                onClick={() => setReportTarget(null)}
              >
                <IconClose size={16} />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-6 text-center text-emerald-400 text-sm">
                {DISCUSSION_CONFIG.copy.reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded bg-zinc-900 border border-white/10 text-white text-xs outline-none"
                    value={reportCategory}
                    onChange={e => setReportCategory(e.target.value)}
                  >
                    {DISCUSSION_CONFIG.reportCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Optional Note (up to 500 characters)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={DISCUSSION_CONFIG.maxReportNoteLength}
                    className="w-full p-2.5 rounded bg-zinc-900 border border-white/10 text-white text-xs outline-none"
                    placeholder="Provide additional context for moderation review..."
                    value={reportNote}
                    onChange={e => setReportNote(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white"
                    onClick={() => setReportTarget(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-medium"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="disc-modal-overlay">
          <div className="disc-modal-dialog">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
              <h3 className="font-semibold text-white text-sm">
                Edit {editTarget.postKind === 'thread' ? 'Thread' : 'Reply'}
              </h3>
              <button
                type="button"
                className="text-zinc-400 hover:text-white"
                onClick={() => setEditTarget(null)}
              >
                <IconClose size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {editTarget.postKind === 'thread' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Title</label>
                  <input
                    type="text"
                    maxLength={DISCUSSION_CONFIG.maxTitleLength}
                    className="w-full px-3 py-2 rounded bg-zinc-900 border border-white/10 text-white text-sm outline-none"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Body</label>
                <textarea
                  rows={6}
                  className="w-full p-3 rounded bg-zinc-900 border border-white/10 text-white text-sm font-mono outline-none"
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white"
                  onClick={() => setEditTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
                >
                  {isEditing ? DISCUSSION_CONFIG.copy.savePending : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
