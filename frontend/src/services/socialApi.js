import api from '../utils/api';

/**
 * frontend/src/services/socialApi.js
 *
 * REST API client functions for Friends, Friend Requests, Privacy Settings, and Notifications.
 */

// ── Notifications ──────────────────────────────────────────────────────────

export async function getNotifications({ cursor, limit, tab } = {}) {
  const params = {};
  if (cursor) params.cursor = cursor;
  if (limit) params.limit = limit;
  if (tab) params.tab = tab;
  const { data } = await api.get('/api/notifications', { params, skipGatedModal: true });
  return data;
}

export async function getUnreadNotificationCount() {
  const { data } = await api.get('/api/notifications/unread-count', { skipGatedModal: true });
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.post(`/api/notifications/${encodeURIComponent(id)}/read`, {}, { skipGatedModal: true });
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post('/api/notifications/read-all', {}, { skipGatedModal: true });
  return data;
}

// ── Friends & Requests ─────────────────────────────────────────────────────

export async function sendFriendRequest({ userId, targetUserId, username }) {
  const payload = {};
  const id = targetUserId || userId;
  if (id) {
    payload.userId = id;
    payload.targetUserId = id;
  }
  if (username) payload.username = username;
  const { data } = await api.post('/api/friends/requests', payload, { skipGatedModal: true });
  return data;
}

export async function getFriendRequests({ direction = 'incoming', cursor, limit } = {}) {
  const params = { direction };
  if (cursor) params.cursor = cursor;
  if (limit) params.limit = limit;
  const { data } = await api.get('/api/friends/requests', { params, skipGatedModal: true });
  return data;
}

export async function acceptFriendRequest(id) {
  const { data } = await api.post(`/api/friends/requests/${encodeURIComponent(id)}/accept`, {}, { skipGatedModal: true });
  return data;
}

export async function declineFriendRequest(id) {
  const { data } = await api.post(`/api/friends/requests/${encodeURIComponent(id)}/decline`, {}, { skipGatedModal: true });
  return data;
}

export async function cancelFriendRequest(id) {
  const { data } = await api.post(`/api/friends/requests/${encodeURIComponent(id)}/cancel`, {}, { skipGatedModal: true });
  return data;
}

export async function unfriendUser(userId) {
  const { data } = await api.delete(`/api/friends/${encodeURIComponent(userId)}`, { skipGatedModal: true });
  return data;
}

export async function getFriendshipStatus(userId) {
  const { data } = await api.get(`/api/friends/status/${encodeURIComponent(userId)}`, { skipGatedModal: true });
  return data;
}

export async function getMutualFriendsCount(userId) {
  const { data } = await api.get(`/api/friends/mutual-count/${encodeURIComponent(userId)}`, { skipGatedModal: true });
  return data;
}

export async function getUserFriends(username, { cursor, limit, q } = {}) {
  const params = {};
  if (cursor) params.cursor = cursor;
  if (limit) params.limit = limit;
  if (q && q.trim()) params.q = q.trim();
  const { data } = await api.get(`/api/users/${encodeURIComponent(username)}/friends`, { params, skipGatedModal: true });
  return data;
}

export async function blockUser(userId) {
  const { data } = await api.post(`/api/friends/block/${encodeURIComponent(userId)}`, {}, { skipGatedModal: true });
  return data;
}

export async function unblockUser(userId) {
  const { data } = await api.delete(`/api/friends/block/${encodeURIComponent(userId)}`, { skipGatedModal: true });
  return data;
}

export async function getFriendsLeaderboard({ cursor, limit } = {}) {
  const params = {};
  if (cursor) params.cursor = cursor;
  if (limit) params.limit = limit;
  const { data } = await api.get('/api/friends/leaderboard', { params, skipGatedModal: true });
  return data;
}

// ── Social Settings ────────────────────────────────────────────────────────

export async function getSocialSettings() {
  const { data } = await api.get('/api/settings/social', { skipGatedModal: true });
  return data;
}

export async function updateSocialSettings(settings) {
  const { data } = await api.put('/api/settings/social', settings, { skipGatedModal: true });
  return data;
}

