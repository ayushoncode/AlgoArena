/**
 * frontend/src/components/voice/VoiceControl.jsx
 *
 * Top bar button for Live Voice.
 * Minimum 44x44px touch bounding box.
 * Shows current icon and tiny status dot. Tapping opens the bottom sheet on phone/tablet,
 * or handles action directly on desktop.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  IconMic,
  IconMicOff,
  IconLock,
  IconAlert,
  IconClose,
  IconMoreVertical,
  IconSpeaker,
  IconSliders,
  IconFlag,
  IconShield,
  IconPhoneOff,
} from './VoiceIcons';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceControl({
  voiceState = 'off',
  isMicMuted = true,
  mutedByOpponent = false,
  speakingLevel = 0,
  outputVolume = 1,
  isOpponentMutedLocally = false,
  isMePremium = false,
  isOppPremium = false,
  requestExpiresAt,
  onOpenPremium,
  onRequestVoice,
  onAcceptVoice,
  onDeclineVoice,
  onEndVoice,
  onToggleMute,
  onToggleOpponentMute,
  onChangeVolume,
  onOpenSettings,
  onOpenReport,
  onOpenBlock,
  onOpenBottomSheet,
}) {
  const [countdown, setCountdown] = useState(30);
  const [showOverflow, setShowOverflow] = useState(false);
  const containerRef = useRef(null);
  const menuItemsRef = useRef([]);

  // Dismiss on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowOverflow(false);
      }
    }
    if (showOverflow) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showOverflow]);

  // Keyboard navigation
  function handleMenuKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowOverflow(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const items = menuItemsRef.current.filter(Boolean);
      const idx = items.indexOf(document.activeElement);
      const nextIdx = (idx + 1) % items.length;
      items[nextIdx]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const items = menuItemsRef.current.filter(Boolean);
      const idx = items.indexOf(document.activeElement);
      const prevIdx = (idx - 1 + items.length) % items.length;
      items[prevIdx]?.focus();
    }
  }

  // 30-second expiry countdown ticker
  useEffect(() => {
    if (voiceState !== 'requesting' && voiceState !== 'incoming') return;
    if (!requestExpiresAt) return;

    function update() {
      const remainingMs = Math.max(0, requestExpiresAt - Date.now());
      setCountdown(Math.ceil(remainingMs / 1000));
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [voiceState, requestExpiresAt]);

  const isConnected = voiceState === 'connected' || voiceState === 'live';

  function handleClick(e) {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenBottomSheet) {
      onOpenBottomSheet();
      return;
    }
    if (!isMePremium) {
      onOpenPremium?.();
    } else if (isConnected) {
      onToggleMute?.();
    } else if (voiceState === 'requesting') {
      onEndVoice?.();
    } else if (voiceState === 'incoming') {
      onAcceptVoice?.();
    } else {
      onRequestVoice?.();
    }
  }

  // Non-premium locked
  if (!isMePremium) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="voice-topbar-btn is-locked"
        title="Live Voice is available to Premium members"
        aria-label="Live voice requires Premium membership. Open Premium upgrade dialog"
      >
        <IconLock size={14} />
        <span className="hidden sm:inline">Voice</span>
        <span className="voice-badge-premium">Premium</span>
      </button>
    );
  }

  // Opponent not premium
  if (!isOppPremium) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="voice-topbar-btn is-locked"
        title="Your opponent needs Premium for voice"
        aria-label="Your opponent needs Premium for voice"
      >
        <IconMicOff size={14} />
        <span className="hidden sm:inline">Voice</span>
      </button>
    );
  }

  // Requesting state
  if (voiceState === 'requesting') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="voice-topbar-btn is-warn"
        aria-label={`Voice requested. Waiting for opponent. ${countdown} seconds remaining. Click to cancel`}
        title="Click to cancel voice request"
      >
        <span className="voice-status-dot bg-[var(--warn)] animate-pulse" />
        <span className="hidden sm:inline">Requesting </span>
        <span className="tabular-nums">({countdown}s)</span>
        <IconClose size={12} />
      </button>
    );
  }

  // Incoming state
  if (voiceState === 'incoming') {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onAcceptVoice}
          className="voice-topbar-btn is-live voice-btn-accept"
          aria-label={`Incoming voice request. ${countdown} seconds remaining. Click to accept`}
        >
          <IconMic size={14} />
          <span className="hidden sm:inline">Accept Voice </span>
          <span className="sm:hidden">Accept </span>
          <span className="tabular-nums">({countdown}s)</span>
        </button>
        <button
          type="button"
          onClick={onDeclineVoice}
          className="voice-topbar-btn px-2"
          aria-label="Decline incoming voice request"
          title="Decline"
        >
          <IconClose size={12} />
        </button>
      </div>
    );
  }

  // Connecting state
  if (voiceState === 'connecting') {
    return (
      <button
        type="button"
        disabled
        className="voice-topbar-btn"
        aria-label="Connecting to live voice"
      >
        <span className="voice-status-dot bg-[var(--info)] animate-pulse" />
        <span>Connecting...</span>
      </button>
    );
  }

  // Connected / Live state
  if (isConnected) {
    const isLive = !isMicMuted;
    return (
      <div className="voice-topbar-group" ref={containerRef} onKeyDown={handleMenuKeyDown}>
        <button
          type="button"
          onClick={handleClick}
          className={`voice-topbar-btn ${isLive ? 'is-live' : 'is-muted'}`}
          aria-label={isLive ? 'Microphone on. Click to mute (Alt+M)' : (mutedByOpponent ? 'Muted by opponent. Click to speak (Alt+M)' : 'Microphone muted. Click to speak (Alt+M)')}
          aria-pressed={!isMicMuted}
          title={isLive ? 'Mic live (Click or Alt+M to mute)' : (mutedByOpponent ? 'Muted by opponent (Click or Alt+M to talk)' : 'Mic off (Click or Alt+M to talk)')}
        >
          {isLive ? <IconMic size={15} /> : <IconMicOff size={15} />}
          <span className="voice-status-dot bg-[var(--info)]" />
          <span className="hidden sm:inline">{isLive ? 'Mic on' : (mutedByOpponent ? 'Muted' : 'Mic off')}</span>
        </button>

        {/* 3-dot overflow menu trigger right next to mic */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenBottomSheet) {
              onOpenBottomSheet();
            } else {
              setShowOverflow(prev => !prev);
            }
          }}
          className="voice-topbar-more-btn"
          aria-label="Voice settings and actions"
          aria-haspopup="true"
          aria-expanded={showOverflow}
          title="Voice options"
        >
          <IconMoreVertical size={15} />
        </button>

        {showOverflow && (
          <div
            role="menu"
            aria-label="Voice options"
            className="voice-overflow-menu"
            style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0 }}
          >
            {/* Output volume slider */}
            <div className="p-2 border-b border-[var(--hairline)]">
              <div className="flex items-center justify-between mb-1.5 font-mono text-[10px] text-[var(--ink-muted)] uppercase">
                <span className="flex items-center gap-1.5">
                  <IconSpeaker size={12} />
                  <span>Output volume</span>
                </span>
                <span className="tabular-nums">{Math.round(outputVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isOpponentMutedLocally ? 0 : outputVolume}
                onChange={(e) => onChangeVolume?.(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--bg-surface)] rounded cursor-pointer accent-[var(--info)]"
                aria-label="Opponent output volume"
              />
            </div>

            {/* Mute Opponent */}
            <button
              type="button"
              role="menuitem"
              ref={el => (menuItemsRef.current[0] = el)}
              onClick={() => {
                onToggleOpponentMute?.();
                setShowOverflow(false);
              }}
              className="voice-overflow-item"
            >
              <IconMicOff size={14} className="text-[var(--ink-muted)] shrink-0" />
              <span>{isOpponentMutedLocally ? 'Unmute opponent' : 'Mute opponent'}</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              role="menuitem"
              ref={el => (menuItemsRef.current[1] = el)}
              onClick={() => {
                onOpenSettings?.();
                setShowOverflow(false);
              }}
              className="voice-overflow-item"
            >
              <IconSliders size={14} className="text-[var(--ink-muted)] shrink-0" />
              <span>Settings</span>
            </button>

            {/* Report voice */}
            <button
              type="button"
              role="menuitem"
              ref={el => (menuItemsRef.current[2] = el)}
              onClick={() => {
                onOpenReport?.();
                setShowOverflow(false);
              }}
              className="voice-overflow-item text-[var(--warn)]"
            >
              <IconFlag size={14} className="shrink-0" />
              <span>Report voice</span>
            </button>

            {/* Block voice from this player */}
            <button
              type="button"
              role="menuitem"
              ref={el => (menuItemsRef.current[3] = el)}
              onClick={() => {
                onOpenBlock?.();
                setShowOverflow(false);
              }}
              className="voice-overflow-item text-[var(--bad)]"
            >
              <IconShield size={14} className="shrink-0" />
              <span>Block voice from this player</span>
            </button>

            {/* End voice */}
            <div className="pt-1 mt-1 border-t border-[var(--hairline)]">
              <button
                type="button"
                role="menuitem"
                ref={el => (menuItemsRef.current[4] = el)}
                onClick={() => {
                  onEndVoice?.();
                  setShowOverflow(false);
                }}
                className="voice-overflow-item text-[var(--bad)] font-semibold"
              >
                <IconPhoneOff size={14} className="shrink-0" />
                <span>End voice</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Reconnecting state
  if (voiceState === 'reconnecting') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="voice-topbar-btn is-warn"
        aria-label="Voice reconnecting"
      >
        <span className="voice-status-dot bg-[var(--warn)] animate-pulse" />
        <span>Reconnecting</span>
      </button>
    );
  }

  // Failed state
  if (voiceState === 'failed') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="voice-topbar-btn is-bad"
        aria-label="Voice connection failed. Click to retry"
        title="Voice connection failed. Click to retry"
      >
        <IconAlert size={14} />
        <span>Retry</span>
      </button>
    );
  }

  // Ended state
  if (voiceState === 'ended') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="voice-topbar-btn"
        aria-label="Voice ended. Click to request again"
        title="Voice ended. Click to request again"
      >
        <IconMic size={14} />
        <span>Voice Ended</span>
      </button>
    );
  }

  // Default Off state
  return (
    <button
      type="button"
      onClick={handleClick}
      className="voice-topbar-btn"
      aria-label="Start voice communication with opponent"
      title="Start voice"
    >
      <IconMic size={14} />
      <span>Voice</span>
    </button>
  );
}
