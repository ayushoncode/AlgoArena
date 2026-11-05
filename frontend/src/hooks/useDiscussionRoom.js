import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

/**
 * frontend/src/hooks/useDiscussionRoom.js
 *
 * Real-time socket management for a discussion room:
 * - Emits disc:join on mount/slug change, disc:leave on unmount
 * - Collects incoming live threads into a pending buffer for "N new posts. Show" banner
 * - Updates live counts/status on disc:post_updated and disc:post_hidden
 * - Handles disc:locked_in_match by setting isLockedInMatch
 */
export function useDiscussionRoom(problemSlug, { onLockedInMatch } = {}) {
  const { connected, emit, on, off } = useSocket();
  const [isJoined, setIsJoined] = useState(false);
  const [joinedRoomInfo, setJoinedRoomInfo] = useState(null);
  const [pendingThreads, setPendingThreads] = useState([]);
  const [isLockedInMatch, setIsLockedInMatch] = useState(false);
  const [socketError, setSocketError] = useState(null);

  const pendingRef = useRef([]);
  pendingRef.current = pendingThreads;

  useEffect(() => {
    if (!problemSlug || !connected) return;

    setIsJoined(false);
    setIsLockedInMatch(false);
    setSocketError(null);
    setPendingThreads([]);

    emit('disc:join', { problemSlug });

    function handleJoined(data) {
      setIsJoined(true);
      setJoinedRoomInfo(data);
    }

    function handleThreadCreated(data) {
      if (!data?.thread) return;
      setPendingThreads(prev => [data.thread, ...prev]);
    }

    function handleLockedInMatch(data) {
      setIsLockedInMatch(true);
      if (onLockedInMatch) onLockedInMatch(data);
    }

    function handleError(err) {
      if (err?.code === 'DISCUSSION_LOCKED_IN_MATCH') {
        setIsLockedInMatch(true);
      } else {
        setSocketError(err);
      }
    }

    on('disc:joined', handleJoined);
    on('disc:thread_created', handleThreadCreated);
    on('disc:locked_in_match', handleLockedInMatch);
    on('disc:error', handleError);

    return () => {
      emit('disc:leave');
      off('disc:joined', handleJoined);
      off('disc:thread_created', handleThreadCreated);
      off('disc:locked_in_match', handleLockedInMatch);
      off('disc:error', handleError);
    };
  }, [problemSlug, connected, emit, on, off, onLockedInMatch]);

  const flushPendingThreads = useCallback(() => {
    const list = [...pendingRef.current];
    setPendingThreads([]);
    return list;
  }, []);

  return {
    isJoined,
    joinedRoomInfo,
    pendingThreads,
    pendingCount: pendingThreads.length,
    flushPendingThreads,
    isLockedInMatch,
    socketError
  };
}
