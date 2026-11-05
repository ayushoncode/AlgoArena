/**
 * frontend/src/components/voice/VoiceRow.jsx
 *
 * Dedicated Desktop/Tablet Voice Row directly under the Rival Header:
 * - Exactly 44px tall with hairline top and bottom borders (no card box)
 * - Muted 12px line under row while voice is active: "Voice is not recorded."
 * - Accessible overflow menu with ArrowUp/ArrowDown cycling and Esc handling
 * - Never uses green for connected state (Mic on uses --info, Mic off uses ink on hairline)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  IconMic,
  IconMicOff,
  IconLock,
  IconAlert,
  IconSpeaker,
  IconPhoneOff,
  IconSliders,
  IconFlag,
  IconShield,
  IconMoreVertical,
  IconCheck,
} from './VoiceIcons';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceRow({
  voiceState = 'off',
  isMicMuted = true,
  isOpponentSpeaking = false,
  speakingLevel = 0,
  opponentSpeakingLevel = 0,
  quality,
  outputVolume = 1,
  isOpponentMutedLocally = false,
  mutedByOpponent = false,
  isMePremium = false,
  isOppPremium = false,
  requestExpiresAt,
  errorMessage,
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
  onClearError,
}) {
  const [countdown, setCountdown] = useState(30);
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef(null);
  const overflowTriggerRef = useRef(null);
  const menuItemsRef = useRef([]);

  // 30s countdown ticker for requesting and incoming states
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

  // Overflow menu keyboard navigation (ArrowUp, ArrowDown, Esc) and click-outside
  useEffect(() => {
    if (!showOverflow) return;

    function handlePointerDown(e) {
      if (overflowRef.current && !overflowRef.current.contains(e.target)) {
        setShowOverflow(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowOverflow(false);
        overflowTriggerRef.current?.focus();
        return;
      }

      const items = menuItemsRef.current.filter(Boolean);
      if (items.length === 0) return;
      const currentIndex = items.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
      }
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    // Auto focus first item on open
    setTimeout(() => {
      menuItemsRef.current[0]?.focus();
    }, 40);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showOverflow]);

  const rating = quality?.rating || 'good';
  const qualityClass = rating === 'poor' ? 'is-poor' : rating === 'fair' ? 'is-fair' : 'is-good';
  const qualityLabel = rating === 'poor' ? 'Poor' : rating === 'fair' ? 'Fair' : 'Good';
  const qualityTooltip = `RTT: ${quality?.rtt || 0}ms · Jitter: ${quality?.jitter || 0}ms · Loss: ${quality?.packetLoss || 0}% · Bitrate: ${Math.round((quality?.bitrate || 0) / 1000)} kbps`;

  const isConnectedOrLive = voiceState === 'connected' || voiceState === 'live';
  const formattedCountdown = `0:${countdown < 10 ? '0' : ''}${countdown}`;

  return (
    <div className="voice-row-container w-full">
      {/* 44px Main Row */}
      <div
        className="voice-row"
        role="region"
        aria-label="Live Voice duel controls"
      >
        {/* State 1: Free user (not premium) */}
        {!isMePremium ? (
          <div className="flex items-center justify-between w-full h-full px-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]">
              <IconMic size={14} className="text-[var(--ink-muted)]" />
              <span>Voice</span>
            </div>
            <button
              type="button"
              onClick={onOpenPremium}
              className="voice-row-btn-text flex items-center gap-1 text-xs font-semibold text-[var(--warn)] hover:underline"
              aria-label="Live Voice requires Premium. Open Premium subscription dialog"
            >
              <IconLock size={12} />
              <span>Premium</span>
            </button>
          </div>
        ) : !isOppPremium ? (
          /* State 2: Opponent not premium */
          <div className="flex items-center w-full h-full px-3">
            <span className="text-xs text-[var(--ink-muted)]">
              Your opponent needs Premium for voice.
            </span>
          </div>
        ) : voiceState === 'requesting' ? (
          /* State 3: Requesting (Waiting for reply) */
          <div className="flex items-center justify-between w-full h-full px-3">
            <div className="flex items-center gap-2 text-xs text-[var(--ink)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] animate-pulse" />
              <span>Waiting for reply</span>
              <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                {formattedCountdown}
              </span>
            </div>
            <button
              type="button"
              onClick={onEndVoice}
              className="voice-row-btn-secondary text-xs"
              aria-label="Cancel voice request"
            >
              Cancel
            </button>
          </div>
        ) : voiceState === 'incoming' ? (
          /* State 4: Incoming request */
          <div className="flex items-center justify-between w-full h-full px-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--ink)]">
              <IconMic size={14} className="text-[var(--info)]" />
              <span>Incoming</span>
              <span className="font-mono text-xs tabular-nums text-[var(--ink-muted)]">
                {formattedCountdown}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onAcceptVoice}
                className="voice-row-btn-accept text-xs voice-btn-accept"
                aria-label="Accept incoming voice"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={onDeclineVoice}
                className="voice-row-btn-secondary text-xs"
                aria-label="Decline incoming voice"
              >
                Decline
              </button>
            </div>
          </div>
        ) : voiceState === 'connecting' ? (
          /* State 5: Connecting */
          <div className="flex items-center gap-2 w-full h-full px-3 text-xs text-[var(--ink-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)]" />
            <span>Connecting...</span>
          </div>
        ) : isConnectedOrLive ? (
          /* State 6: Connected or Live */
          <div className="flex items-center justify-between w-full h-full px-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* 40px Mic Button */}
              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={!isMicMuted}
                aria-label={isMicMuted ? 'Microphone is off. Click or press Alt+M to talk' : 'Microphone is on. Click or press Alt+M to mute'}
                title="Toggle microphone (Alt+M)"
                className={`voice-row__mic-btn ${!isMicMuted ? 'is-live' : 'is-muted'} voice-dock__mute-btn`}
              >
                {!isMicMuted ? <IconMic size={16} /> : <IconMicOff size={16} />}
              </button>

              <span className="text-xs font-medium text-[var(--ink)] whitespace-nowrap">
                {!isMicMuted ? 'Mic on' : (mutedByOpponent ? 'Muted by opponent' : 'Mic off')}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Network Quality Badge (3 bars + Good/Fair/Poor) */}
              <div
                className={`voice-quality-badge ${qualityClass}`}
                title={qualityTooltip}
                aria-label={`Network quality is ${qualityLabel}. ${qualityTooltip}`}
                tabIndex={0}
              >
                <div className="voice-quality-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span>{qualityLabel}</span>
              </div>

              {/* Overflow Menu Button */}
              <div className="relative" ref={overflowRef}>
                <button
                  type="button"
                  ref={overflowTriggerRef}
                  onClick={() => setShowOverflow(s => !s)}
                  className="voice-row__overflow-btn voice-dock__more-btn"
                  aria-label="Voice settings and actions"
                  aria-haspopup="true"
                  aria-expanded={showOverflow}
                >
                  <IconMoreVertical size={16} />
                </button>

                {showOverflow && (
                  <div
                    role="menu"
                    aria-label="Voice options"
                    className="voice-overflow-menu"
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
                      className="voice-overflow-item voice-dock__menu-item"
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
                      className="voice-overflow-item voice-dock__menu-item"
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
                      className="voice-overflow-item voice-dock__menu-item text-[var(--warn)]"
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
                      className="voice-overflow-item voice-dock__menu-item text-[var(--bad)]"
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
                        className="voice-overflow-item voice-dock__menu-item voice-dock__menu-item--danger text-[var(--bad)] font-semibold"
                      >
                        <IconPhoneOff size={14} className="shrink-0" />
                        <span>End voice</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : voiceState === 'reconnecting' ? (
          /* State 7: Reconnecting */
          <div className="flex items-center justify-between w-full h-full px-3">
            <div className="flex items-center gap-2 text-xs text-[var(--warn)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] animate-pulse" />
              <span>Reconnecting</span>
            </div>
            <button
              type="button"
              onClick={onEndVoice}
              className="voice-row-btn-secondary text-xs"
              aria-label="End reconnecting voice call"
            >
              End
            </button>
          </div>
        ) : voiceState === 'failed' ? (
          /* State 8: Failed */
          <div className="flex items-center justify-between w-full h-full px-3 text-xs gap-2">
            <div className="flex items-center gap-1.5 text-[var(--bad)] min-w-0">
              <IconAlert size={14} className="shrink-0" />
              <span className="truncate">
                {errorMessage?.includes('permission')
                  ? 'Microphone permission denied.'
                  : errorMessage || 'Connection failed.'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {errorMessage?.includes('permission') && (
                <a
                  href="https://support.google.com/chrome/answer/2693767"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--info)] hover:underline"
                >
                  How to fix
                </a>
              )}
              <button
                type="button"
                onClick={onRequestVoice}
                className="voice-row-btn-secondary text-xs"
                aria-label="Retry live voice"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          /* State 9: Off or Ended */
          <div className="flex items-center justify-between w-full h-full px-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]">
              <IconMic size={14} className="text-[var(--ink-muted)]" />
              <span>Voice</span>
            </div>
            <button
              type="button"
              onClick={onRequestVoice}
              className="voice-row-btn-secondary text-xs voice-topbar-btn"
              aria-label="Start voice chat with opponent"
            >
              Start voice
            </button>
          </div>
        )}
      </div>

      {/* Muted 12px line directly under row only while voice is active */}
      {isConnectedOrLive && (
        <div className="voice-notice-line">
          {mutedByOpponent ? 'You were muted by opponent. Turn on mic to speak.' : 'Voice is not recorded.'}
        </div>
      )}
    </div>
  );
}

