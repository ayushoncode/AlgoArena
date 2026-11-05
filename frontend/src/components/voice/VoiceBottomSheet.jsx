/**
 * frontend/src/components/voice/VoiceBottomSheet.jsx
 *
 * Phone & portrait tablet bottom sheet for Live Voice:
 * - Max 70dvh, swipe down or Esc to dismiss, hairline top border, solid surface
 * - Header: "Voice with [opponent]" and 44px close button
 * - Status block with mic button 48px, volume slider, network quality, Mute opponent, End voice
 * - Danger actions at bottom (hairline separated): Block voice, Report voice
 * - Clear note: "Voice stays active while you switch tabs in this duel."
 */

import React, { useEffect, useRef } from 'react';
import {
  IconMic,
  IconMicOff,
  IconSpeaker,
  IconPhoneOff,
  IconFlag,
  IconShield,
  IconClose,
  IconLock,
} from './VoiceIcons';
import './voice.css';

export default function VoiceBottomSheet({
  isOpen,
  onClose,
  opp,
  voiceState = 'off',
  isMicMuted = true,
  quality,
  outputVolume = 1,
  isOpponentMutedLocally = false,
  isMePremium = false,
  isOppPremium = false,
  onOpenPremium,
  onRequestVoice,
  onAcceptVoice,
  onDeclineVoice,
  onEndVoice,
  onToggleMute,
  onToggleOpponentMute,
  onChangeVolume,
  onOpenReport,
  onOpenBlock,
}) {
  const sheetRef = useRef(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const opponentName = opp?.username || 'Opponent';
  const rating = quality?.rating || 'good';
  const qualityClass = rating === 'poor' ? 'is-poor' : rating === 'fair' ? 'is-fair' : 'is-good';
  const qualityLabel = rating === 'poor' ? 'Poor' : rating === 'fair' ? 'Fair' : 'Good';
  const isConnected = voiceState === 'connected' || voiceState === 'live';

  function handleTouchStart(e) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 80) {
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Voice with ${opponentName}`}
      className="voice-bottom-sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="voice-bottom-sheet"
      >
        {/* Swipe drag handle */}
        <div className="voice-bottom-sheet__handle-wrap">
          <div className="voice-bottom-sheet__handle" />
        </div>

        {/* Header */}
        <div className="voice-bottom-sheet__header">
          <div className="flex items-center gap-2 min-w-0">
            <IconMic size={16} className="text-[var(--info)] shrink-0" />
            <h3 className="font-semibold text-sm text-[var(--ink)] truncate">
              Voice with {opponentName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="voice-bottom-sheet__close-btn"
            aria-label="Close voice panel"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Body content */}
        <div className="voice-bottom-sheet__body">
          {!isMePremium ? (
            <div className="p-4 rounded-md border border-[var(--hairline)] bg-[var(--bg-surface)] text-center space-y-3">
              <IconLock size={20} className="mx-auto text-[var(--warn)]" />
              <p className="text-xs text-[var(--ink)]">
                Live Voice is available to Premium members.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPremium?.();
                }}
                className="voice-btn-primary w-full h-11"
              >
                Upgrade to Premium
              </button>
            </div>
          ) : !isOppPremium ? (
            <div className="p-4 rounded-md border border-[var(--hairline)] bg-[var(--bg-surface)] text-center">
              <p className="text-xs text-[var(--ink-muted)]">
                Your opponent needs Premium for voice.
              </p>
            </div>
          ) : isConnected ? (
            <div className="space-y-4">
              {/* 48px Mic button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-pressed={!isMicMuted}
                  className={`voice-bottom-sheet__mic-btn ${!isMicMuted ? 'is-live' : 'is-muted'}`}
                >
                  {!isMicMuted ? <IconMic size={20} /> : <IconMicOff size={20} />}
                  <span>{!isMicMuted ? 'Mic on' : 'Mic off'}</span>
                </button>

                {/* Quality badge */}
                <div
                  className={`voice-quality-badge ${qualityClass}`}
                  aria-label={`Network quality: ${qualityLabel}`}
                >
                  <div className="voice-quality-bars" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>{qualityLabel}</span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="p-3 rounded-md border border-[var(--hairline)] bg-[var(--bg-surface)]">
                <div className="flex items-center justify-between mb-2 font-mono text-[11px] text-[var(--ink-muted)]">
                  <span className="flex items-center gap-1.5">
                    <IconSpeaker size={14} />
                    <span>Opponent volume</span>
                  </span>
                  <span>{Math.round(outputVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isOpponentMutedLocally ? 0 : outputVolume}
                  onChange={(e) => onChangeVolume?.(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[var(--bg-base)] rounded cursor-pointer accent-[var(--info)]"
                  aria-label="Opponent volume"
                />
              </div>

              {/* Mute Opponent toggle */}
              <button
                type="button"
                onClick={onToggleOpponentMute}
                className="voice-bottom-sheet__action-btn"
              >
                <IconMicOff size={16} className="text-[var(--ink-muted)]" />
                <span>{isOpponentMutedLocally ? 'Unmute opponent' : 'Mute opponent'}</span>
              </button>

              {/* End voice button */}
              <button
                type="button"
                onClick={() => {
                  onEndVoice?.();
                  onClose();
                }}
                className="voice-bottom-sheet__end-btn"
              >
                <IconPhoneOff size={16} />
                <span>End voice</span>
              </button>
            </div>
          ) : voiceState === 'requesting' ? (
            <div className="p-4 rounded-md border border-[var(--hairline)] bg-[var(--bg-surface)] text-center space-y-3">
              <p className="text-xs text-[var(--ink)]">Waiting for opponent to accept...</p>
              <button
                type="button"
                onClick={() => {
                  onEndVoice?.();
                  onClose();
                }}
                className="voice-btn-secondary w-full h-11"
              >
                Cancel Request
              </button>
            </div>
          ) : voiceState === 'incoming' ? (
            <div className="p-4 rounded-md border border-[var(--hairline)] bg-[var(--bg-surface)] space-y-3">
              <p className="text-xs text-center text-[var(--ink)] font-semibold">
                {opponentName} is requesting live voice
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onAcceptVoice?.();
                    onClose();
                  }}
                  className="voice-btn-primary flex-1 h-11"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeclineVoice?.();
                    onClose();
                  }}
                  className="voice-btn-secondary flex-1 h-11"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  onRequestVoice?.();
                }}
                className="voice-btn-primary w-full h-11"
              >
                Start Voice
              </button>
            </div>
          )}

          {/* Danger actions at bottom (hairline separated) */}
          <div className="pt-3 border-t border-[var(--hairline)] space-y-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReport?.();
              }}
              className="voice-bottom-sheet__danger-btn text-[var(--warn)]"
            >
              <IconFlag size={15} />
              <span>Report voice</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBlock?.();
              }}
              className="voice-bottom-sheet__danger-btn text-[var(--bad)]"
            >
              <IconShield size={15} />
              <span>Block voice from this player</span>
            </button>
          </div>

          {/* Clear note */}
          <p className="voice-bottom-sheet__note">
            Voice stays active while you switch tabs in this duel.
          </p>
        </div>
      </div>
    </div>
  );
}

