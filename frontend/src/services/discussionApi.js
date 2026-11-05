import api from '../utils/api';

/**
 * frontend/src/services/discussionApi.js
 *
 * REST API client functions for AlgoArena Discussion Rooms.
 */

export async function getDiscussionRooms() {
  const { data } = await api.get('/api/discussion/rooms');
  return data;
}

export async function getDiscussionRoom(slug, { type, sort, q, cursor } = {}) {
  const params = {};
  if (type && type !== 'all') params.type = type;
  if (sort) params.sort = sort;
  if (q && q.trim()) params.q = q.trim();
  if (cursor) params.cursor = cursor;

  const { data } = await api.get(`/api/discussion/rooms/${encodeURIComponent(slug)}`, { params });
  return data;
}

export async function getDiscussionThread(id) {
  const { data } = await api.get(`/api/discussion/threads/${encodeURIComponent(id)}`);
  return data;
}

export async function getMyThreads() {
  const { data } = await api.get('/api/discussion/mine');
  return data;
}

export async function getUnreadReplies(since = null) {
  const params = since ? { since } : {};
  const { data } = await api.get('/api/discussion/unread', { params });
  return data;
}

export async function createThread({ slug, problemId, type, title, body }) {
  const { data } = await api.post('/api/discussion/threads', {
    slug,
    problemId,
    type,
    title,
    body
  });
  return data;
}

export async function createReply(threadId, { body, replyToId = null }) {
  const { data } = await api.post(`/api/discussion/threads/${encodeURIComponent(threadId)}/replies`, {
    body,
    replyToId
  });
  return data;
}

export async function editThread(id, { title, body }) {
  const { data } = await api.patch(`/api/discussion/threads/${encodeURIComponent(id)}`, {
    title,
    body
  });
  return data;
}

export async function editReply(id, { body }) {
  const { data } = await api.patch(`/api/discussion/replies/${encodeURIComponent(id)}`, {
    body
  });
  return data;
}

export async function deleteThread(id) {
  const { data } = await api.delete(`/api/discussion/threads/${encodeURIComponent(id)}`);
  return data;
}

export async function deleteReply(id) {
  const { data } = await api.delete(`/api/discussion/replies/${encodeURIComponent(id)}`);
  return data;
}

export async function toggleVote({ postKind, postId }) {
  const { data } = await api.post('/api/discussion/vote', {
    postKind,
    postId
  });
  return data;
}

export async function submitReport({ postKind, postId, category, note }) {
  const { data } = await api.post('/api/discussion/report', {
    postKind,
    postId,
    category,
    note
  });
  return data;
}

export async function blockUser(blockedUserId) {
  const { data } = await api.post('/api/discussion/block', {
    blockedUserId
  });
  return data;
}

export async function unblockUser(userId) {
  const { data } = await api.delete(`/api/discussion/block/${encodeURIComponent(userId)}`);
  return data;
}
