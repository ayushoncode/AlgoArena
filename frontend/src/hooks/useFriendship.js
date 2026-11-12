import { useState, useEffect, useCallback } from 'react';
import socket from '../utils/socket';
import { useAuth } from './useAuth';
import {
  getFriendshipStatus,
  getMutualFriendsCount,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriendUser,
  blockUser,
  unblockUser
} from '../services/socialApi';

/**
 * frontend/src/hooks/useFriendship.js
 *
 * Hook managing friendship state, actions, and real-time socket events for a given target user.
 */

export function useFriendship(targetUserId, targetUsername = null, initialStatus = null) {
  const { user: currentUser } = useAuth();
  const [relation, setRelation] = useState(initialStatus || 'none');
  const [friendshipId, setFriendshipId] = useState(null);
  const [mutualCount, setMutualCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const isSelf = currentUser && (
    (targetUserId && (currentUser.id === targetUserId || String(currentUser.id) === String(targetUserId))) ||
    (targetUsername && currentUser.username?.toLowerCase() === targetUsername?.toLowerCase())
  );

  const targetIdentifier = targetUserId || targetUsername;

  const refreshStatus = useCallback(async () => {
    if (!targetIdentifier || isSelf) {
      if (isSelf) setRelation('self');
      return;
    }
    setLoading(true);
    try {
      const [statusRes, mutualRes] = await Promise.all([
        getFriendshipStatus(targetIdentifier),
        targetUserId ? getMutualFriendsCount(targetUserId).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 })
      ]);
      const currentRel = statusRes?.relation || statusRes?.status || 'none';
      setRelation(currentRel);
      setFriendshipId(statusRes?.friendshipId || null);
      setMutualCount(mutualRes?.count || 0);
    } catch {
      // Retain previous state on error
    } finally {
      setLoading(false);
    }
  }, [targetIdentifier, targetUserId, isSelf]);

  useEffect(() => {
    if (targetIdentifier) {
      refreshStatus();
    }
  }, [targetIdentifier, refreshStatus]);

  // Listen to socket friend events
  useEffect(() => {
    if (!targetUserId || isSelf) return;

    const onFriendAdded = (data) => {
      if (data?.friendUserId === targetUserId || String(data?.friendUserId) === String(targetUserId)) {
        setRelation('friends');
      }
    };

    const onFriendRemoved = (data) => {
      if (data?.friendUserId === targetUserId || String(data?.friendUserId) === String(targetUserId)) {
        setRelation('none');
      }
    };

    socket.on('social:friend_added', onFriendAdded);
    socket.on('social:friend_removed', onFriendRemoved);

    return () => {
      socket.off('social:friend_added', onFriendAdded);
      socket.off('social:friend_removed', onFriendRemoved);
    };
  }, [targetUserId, isSelf]);

  const handleSendRequest = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      const res = await sendFriendRequest({ userId: targetUserId, targetUserId, username: targetUsername });
      if (res.status === 'accepted') {
        setRelation('friends');
      } else {
        setRelation('pending_out');
      }
      if (res.id) setFriendshipId(res.id);
    } catch (err) {
      console.error('[Friend request error]', err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAccept = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      if (friendshipId) {
        await acceptFriendRequest(friendshipId);
      } else {
        // If no friendshipId cached, accept via sending mutual
        await sendFriendRequest({ userId: targetUserId });
      }
      setRelation('friends');
    } catch {
      // Retain state
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDecline = async () => {
    if (actionInProgress || !friendshipId) return;
    setActionInProgress(true);
    try {
      await declineFriendRequest(friendshipId);
      setRelation('none');
    } catch {
      // Retain state
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCancel = async () => {
    if (actionInProgress || !friendshipId) return;
    setActionInProgress(true);
    try {
      await cancelFriendRequest(friendshipId);
      setRelation('none');
    } catch {
      // Retain state
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUnfriend = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      await unfriendUser(targetUserId);
      setRelation('none');
    } catch {
      // Retain state
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBlock = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      await blockUser(targetUserId);
      setRelation('none');
    } catch {
      // Retain state
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUnblock = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      await unblockUser(targetUserId);
      setRelation('none');
    } catch {
      // Retain state
    } finally {
      setActionInProgress(false);
    }
  };

  return {
    relation,
    isSelf,
    mutualCount,
    loading,
    actionInProgress,
    sendRequest: handleSendRequest,
    accept: handleAccept,
    decline: handleDecline,
    cancel: handleCancel,
    unfriend: handleUnfriend,
    block: handleBlock,
    unblock: handleUnblock,
    refreshStatus
  };
}

