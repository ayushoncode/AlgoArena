/**
 * frontend/src/voice/useLiveVoice.js
 *
 * Hook managing Live Voice state machine, socket consent signaling,
 * lazy-loaded provider lifecycle, device management, and keyboard shortcuts.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { VOICE_CONFIG } from '../content/voice';

export function useLiveVoice({ roomId, me, opp, socket, isConnected, isMePremium, isOppPremium, oppBadgeResolved = true }) {
  const [voiceState, setVoiceState] = useState('off'); // off, requesting, incoming, connecting, connected, live, reconnecting, failed, ended
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOpponentSpeaking, setIsOpponentSpeaking] = useState(false);
  const [speakingLevel, setSpeakingLevel] = useState(0);
  const [opponentSpeakingLevel, setOpponentSpeakingLevel] = useState(0);
  const [quality, setQuality] = useState({ rating: 'good', rtt: 0, jitter: 0, packetLoss: 0, bitrate: 0 });
  const [outputVolume, setOutputVolume] = useState(1.0);
  const [isOpponentMutedLocally, setIsOpponentMutedLocally] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [requestedBy, setRequestedBy] = useState(null);
  const [requestExpiresAt, setRequestExpiresAt] = useState(null);
  const [requestCount, setRequestCount] = useState(0);

  // Modals
  const [showFirstUseModal, setShowFirstUseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [pushToTalkEnabled, setPushToTalkEnabled] = useState(false);

  // Aria announcements
  const [voiceAnnouncement, setVoiceAnnouncement] = useState('');

  const providerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const pendingActionRef = useRef(null); // 'start' | 'accept'
  const doStartVoiceRequestRef = useRef(null);
  const doAcceptVoiceRef = useRef(null);

  const myId = String(me?.id || me?.userId || '');
  const oppId = String(opp?.id || opp?.userId || '');

  // ── First-use check ──────────────────────────────────────────
  const isFirstUseAcked = useCallback(() => {
    try {
      return localStorage.getItem('algoarena_voice_ack') === 'true';
    } catch {
      return false;
    }
  }, []);

  const markFirstUseAcked = useCallback(() => {
    try {
      localStorage.setItem('algoarena_voice_ack', 'true');
    } catch { }
    setShowFirstUseModal(false);
    if (pendingActionRef.current === 'start') {
      pendingActionRef.current = null;
      if (doStartVoiceRequestRef.current) {
        doStartVoiceRequestRef.current();
      }
    } else if (pendingActionRef.current === 'accept') {
      pendingActionRef.current = null;
      if (doAcceptVoiceRef.current) {
        doAcceptVoiceRef.current();
      }
    }
  }, []);

  // ── Lazy load and initialize provider ────────────────────────
  const getProvider = useCallback(async () => {
    if (!providerRef.current) {
      const { LiveKitVoiceProvider } = await import('./LiveKitVoiceProvider');
      const provider = new LiveKitVoiceProvider();

      provider.onSpeaking((speakers) => {
        let meSpeaking = false;
        let oppSpeaking = false;
        let myLvl = 0;
        let oppLvl = 0;

        for (const s of speakers) {
          const sLevel = s.audioLevel || 0;
          if (String(s.identity) === myId) {
            myLvl = sLevel;
            if (s.isSpeaking || sLevel > 0.08) meSpeaking = true;
          } else {
            oppLvl = sLevel;
            if (s.isSpeaking || sLevel > 0.08) oppSpeaking = true;
          }
        }

        setIsSpeaking(meSpeaking);
        setIsOpponentSpeaking(oppSpeaking);
        setSpeakingLevel(myLvl);
        setOpponentSpeakingLevel(oppLvl);
      });

      provider.onQuality((q) => {
        setQuality(q);
      });

      provider.onEvent((event, data) => {
        if (event === 'connected') {
          setVoiceState('connected');
          setIsMicMuted(true);
          setVoiceAnnouncement('Voice connected, microphone muted');
        } else if (event === 'reconnecting') {
          setVoiceState('reconnecting');
          setVoiceAnnouncement('Reconnecting to voice');
        } else if (event === 'reconnected') {
          setVoiceState('connected');
          setVoiceAnnouncement('Voice reconnected');
        } else if (event === 'disconnected') {
          setVoiceState('ended');
          setVoiceAnnouncement('Voice disconnected');
          if (data?.isDuplicateIdentity) {
            setErrorMessage(VOICE_CONFIG.copy.singleTabWarning);
          }
        }
      });

      providerRef.current = provider;
    }
    return providerRef.current;
  }, [myId]);

  // ── Connect using server token ───────────────────────────────
  const connectVoiceSession = useCallback(async () => {
    setVoiceState('connecting');
    setErrorMessage(null);
    try {
      const res = await api.post('/api/voice/token', { roomId });
      const { token, url } = res.data;
      const provider = await getProvider();
      await provider.connect({ url, token });
    } catch (err) {
      console.error('[LiveVoice] Token connection error:', err);
      const code = err.response?.data?.code || 'CONNECTION_FAILED';
      let message = err.response?.data?.message || VOICE_CONFIG.copy.connectionFailed;

      if (code === 'PREMIUM_REQUIRED') {
        message = VOICE_CONFIG.copy.premiumRequired;
      } else if (code === 'BLOCKED') {
        message = 'Voice communication is blocked.';
      } else if (code === 'LIMIT_REACHED') {
        message = 'Daily voice cap reached.';
      }

      setVoiceState('failed');
      setErrorMessage(message);
    }
  }, [roomId, getProvider]);

  // ── Socket Signalling Listeners ──────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    function handleVoiceState(data) {
      if (data.roomId && data.roomId !== roomId) return;

      if (data.requestCount !== undefined) {
        setRequestCount(data.requestCount);
      }

      if (data.status === 'requesting') {
        setRequestedBy(data.requestedBy);
        setRequestExpiresAt(data.expiresAt);
        if (String(data.requestedBy) === myId) {
          setVoiceState('requesting');
        } else {
          setVoiceState('incoming');
        }
      } else if (data.status === 'accepted') {
        connectVoiceSession();
      } else if (data.status === 'idle') {
        setVoiceState('off');
        setRequestedBy(null);
        setRequestExpiresAt(null);
        if (data.reason === 'expired') {
          setErrorMessage(VOICE_CONFIG.copy.requestExpired);
        } else if (data.reason === 'declined') {
          setErrorMessage(VOICE_CONFIG.copy.requestDeclined);
        } else if (data.reason === 'opponent_not_premium') {
          setErrorMessage(VOICE_CONFIG.copy.opponentNotPremium);
        } else if (data.reason === 'premium_required') {
          setErrorMessage(VOICE_CONFIG.copy.premiumRequired);
        }
      } else if (data.status === 'failed') {
        setVoiceState('failed');
        setErrorMessage(data.message || VOICE_CONFIG.copy.connectionFailed);
      } else if (data.status === 'limit_reached') {
        setErrorMessage(VOICE_CONFIG.copy.limitReached);
      } else if (data.status === 'ended') {
        if (providerRef.current) {
          providerRef.current.disconnect();
        }
        setVoiceState('ended');
        setRequestedBy(null);
        setRequestExpiresAt(null);
      }
    }

    socket.on('voice:state', handleVoiceState);

    // Initial state query
    socket.emit('voice:state', { roomId });

    return () => {
      socket.off('voice:state', handleVoiceState);
    };
  }, [socket, isConnected, roomId, myId, connectVoiceSession]);

  // ── Actions: Start, Accept, Decline, End ─────────────────────
  const doStartVoiceRequest = useCallback(() => {
    if (!socket || !roomId) return;
    setErrorMessage(null);

    // Eligibility check
    if (!isMePremium) {
      setErrorMessage(VOICE_CONFIG.copy.premiumRequired);
      return;
    }
    // Only pre-gate opponent if badges have actually loaded and opponent is confirmed non-premium
    if (oppBadgeResolved && !isOppPremium) {
      setErrorMessage(VOICE_CONFIG.copy.opponentNotPremium);
      return;
    }

    // In-app browser detection
    const isSpecialInApp = /(FBAN|FBAV|Instagram|WhatsApp|TikTok|Snapchat)/i.test(navigator.userAgent);
    if (isSpecialInApp) {
      setErrorMessage(VOICE_CONFIG.copy.inAppBrowserNotice);
      return;
    }

    socket.emit('voice:request', { roomId });
  }, [socket, roomId, isMePremium, isOppPremium, oppBadgeResolved]);

  doStartVoiceRequestRef.current = doStartVoiceRequest;

  const requestVoice = useCallback(() => {
    if (!isFirstUseAcked()) {
      pendingActionRef.current = 'start';
      setShowFirstUseModal(true);
      return;
    }
    doStartVoiceRequest();
  }, [isFirstUseAcked, doStartVoiceRequest]);

  const doAcceptVoice = useCallback(() => {
    if (!socket || !roomId) return;
    setErrorMessage(null);
    socket.emit('voice:accept', { roomId });
  }, [socket, roomId]);

  doAcceptVoiceRef.current = doAcceptVoice;

  const acceptVoice = useCallback(() => {
    if (!isFirstUseAcked()) {
      pendingActionRef.current = 'accept';
      setShowFirstUseModal(true);
      return;
    }
    doAcceptVoice();
  }, [isFirstUseAcked, doAcceptVoice]);

  const declineVoice = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('voice:decline', { roomId });
    setVoiceState('off');
  }, [socket, roomId]);

  const endVoice = useCallback(() => {
    if (socket && roomId) {
      socket.emit('voice:end', { roomId });
    }
    if (providerRef.current) {
      providerRef.current.disconnect();
    }
    setVoiceState('ended');
    setVoiceAnnouncement('Voice ended');
  }, [socket, roomId]);

  // ── Microphone Mute Toggle ───────────────────────────────────
  const toggleMute = useCallback(async () => {
    if (!providerRef.current) return;
    const nextMuted = !isMicMuted;
    try {
      await providerRef.current.setMicEnabled(!nextMuted);
      setIsMicMuted(nextMuted);
      if (nextMuted) {
        setVoiceState('connected');
        setVoiceAnnouncement('Microphone muted');
      } else {
        setVoiceState('live');
        setVoiceAnnouncement('Microphone live');
      }
    } catch (err) {
      console.warn('[LiveVoice] setMicEnabled error:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage(VOICE_CONFIG.copy.permissionDenied);
      } else if (err.name === 'NotFoundError') {
        setErrorMessage(VOICE_CONFIG.copy.noMicrophone);
      }
    }
  }, [isMicMuted]);

  // ── Alt+M Keyboard Shortcut ──────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      // Alt+M toggle (Option+M on mac)
      if (e.altKey && (e.key === 'm' || e.key === 'M' || e.code === 'KeyM')) {
        // Prevent toggle if focus is in a text input or textarea
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (voiceState === 'connected' || voiceState === 'live') {
          e.preventDefault();
          toggleMute();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, toggleMute]);

  // ── Local Opponent Mute ──────────────────────────────────────
  const toggleOpponentMuteLocally = useCallback(() => {
    if (!providerRef.current) return;
    const nextMuted = !isOpponentMutedLocally;
    setIsOpponentMutedLocally(nextMuted);
    providerRef.current.setOutputVolume(nextMuted ? 0 : outputVolume);
  }, [isOpponentMutedLocally, outputVolume]);

  const changeOutputVolume = useCallback((vol) => {
    setOutputVolume(vol);
    if (providerRef.current && !isOpponentMutedLocally) {
      providerRef.current.setOutputVolume(vol);
    }
  }, [isOpponentMutedLocally]);

  // ── Teardown on unmount or match finish ───────────────────────
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  return {
    voiceState,
    isMicMuted,
    isSpeaking,
    isOpponentSpeaking,
    speakingLevel,
    opponentSpeakingLevel,
    quality,
    outputVolume,
    isOpponentMutedLocally,
    errorMessage,
    requestedBy,
    requestExpiresAt,
    requestCount,
    voiceAnnouncement,
    // Modals
    showFirstUseModal,
    setShowFirstUseModal,
    markFirstUseAcked,
    showSettingsModal,
    setShowSettingsModal,
    showReportModal,
    setShowReportModal,
    showBlockModal,
    setShowBlockModal,
    pushToTalkEnabled,
    setPushToTalkEnabled,
    // Actions
    requestVoice,
    acceptVoice,
    declineVoice,
    endVoice,
    toggleMute,
    toggleOpponentMuteLocally,
    changeOutputVolume,
    clearError: () => setErrorMessage(null),
  };
}

