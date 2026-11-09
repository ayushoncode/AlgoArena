import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../utils/socket';
import { useAuth } from './useAuth';
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../services/socialApi';

/**
 * frontend/src/hooks/useNotifications.js
 *
 * Hook managing real-time notification updates, unread count,
 * socket listeners (notif:created, notif:count), and a 60-second polling fallback.
 */

export function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'requests'

  // Fetch unread count from server
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getUnreadNotificationCount();
      const count = data?.unreadCount ?? data?.count;
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    } catch {
      // Fail quietly without throwing in background
    }
  }, [isAuthenticated]);

  // Fetch notifications list
  const fetchList = useCallback(async (tab = activeTab, cursor = null) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await getNotifications({ tab, cursor, limit: 20 });
      const list = data?.items || data?.notifications || [];
      if (cursor) {
        setNotifications(prev => [...prev, ...list]);
      } else {
        setNotifications(list);
      }
      setNextCursor(data?.nextCursor || null);
    } catch {
      // Retain existing state on transient failure
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab]);

  // Mark single notification read
  const handleMarkRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // No-op
    }
  }, []);

  // Mark all notifications read
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // No-op
    }
  }, []);

  // Socket event listeners and connection lifecycle
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Initial count fetch
    fetchUnreadCount();

    const onNotificationCreated = (data) => {
      if (data?.notification) {
        setNotifications(prev => [data.notification, ...prev]);
      }
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      } else {
        setUnreadCount(prev => prev + 1);
      }
    };

    const onUnreadCount = (data) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    const onFriendAdded = (data) => {
      const fid = data?.friendshipId;
      const fUid = data?.friendId;
      if (fid || fUid) {
        setNotifications(prev =>
          prev.map(n => {
            const nFid = n.entityId || n.entity_id;
            const nActorId = n.actor?.id || n.actor_id;
            if ((fid && nFid === fid) || (fUid && nActorId === fUid)) {
              return { ...n, status: 'accepted', entityStatus: 'accepted' };
            }
            return n;
          })
        );
      }
    };

    socket.on('notif:created', onNotificationCreated);
    socket.on('notif:count', onUnreadCount);
    socket.on('social:friend_added', onFriendAdded);

    // 60-second polling fallback while document is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, 60000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      socket.off('notif:created', onNotificationCreated);
      socket.off('notif:count', onUnreadCount);
      socket.off('social:friend_added', onFriendAdded);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, user, fetchUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    nextCursor,
    activeTab,
    setActiveTab,
    fetchList,
    fetchUnreadCount,
    markAsRead: handleMarkRead,
    markAllAsRead: handleMarkAllRead,
    setNotifications
  };
}

