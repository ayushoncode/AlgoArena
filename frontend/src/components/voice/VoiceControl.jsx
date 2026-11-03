/**
 * frontend/src/components/voice/VoiceControl.jsx
 *
 * Top bar button for Live Voice.
 * Displays current voice state with a mark and text label (never color alone).
 * Keyboard operable with standard focus rings and aria attributes.
 */

import React, { useState, useEffect } from 'react';
import {
  IconMic,
  IconMicOff,
  IconLock,
  IconAlert,
  IconClose,
} from './VoiceIcons';
import AudioWaveBar from './AudioWaveBar';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceControl({
  voiceState,
  isMicMuted,
  speakingLevel = 0,
  isMePremium,
  isOppPremium,
  requestExpiresAt,
  onOpenPremium,
  onRequestVoice,
  onAcceptVoice,
  onDeclineVoice,
  onEndVoice,
  onToggleMute,
  onOpenDock,
}) {
  const [countdown, setCountdown] = useState(30);

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

  // Non-premium locked button
  if (!isMePremium) {
    return (
      <button
        type="button"
        onClick={onOpenPremium}
        className="voice-topbar-btn is-locked"
        title="Live Voice is available to Premium members"
        aria-label="Live voice requires Premium membership. Open Premium upgrade dialog"
      >
        <IconLock size={12} />
        <span>Voice</span>
        <span className="voice-badge-premium">Premium</span>
      </button>
    );
  }

  // Requesting state (countdown with cancel)
  if (voiceState === 'requesting') {
    return (
      <div className="voice-root">
        <button
          type="button"
          onClick={onEndVoice}
          className="voice-topbar-btn is-warn"
          aria-label={`Voice requested. Waiting for opponent. ${countdown} seconds remaining. Click to cancel`}
          title="Click to cancel voice request"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--warn)]" />
          <span className="hidden sm:inline">Requesting </span>
          <span>({countdown}s)</span>
          <IconClose size={12} />
        </button>
      </div>
    );
  }

  // Incoming state (Accept / Decline directly in topbar if compact)
  if (voiceState === 'incoming') {
    return (
      <div className="voice-root gap-1">
        <button
          type="button"
          onClick={onAcceptVoice}
          className="voice-topbar-btn is-live"
          aria-label={`Incoming voice request from opponent. ${countdown} seconds remaining. Click to accept`}
        >
          <IconMic size={12} />
          <span className="hidden sm:inline">Accept Voice </span>
          <span className="sm:hidden">Accept </span>
          <span>({countdown}s)</span>
        </button>
        <button
          type="button"
          onClick={onDeclineVoice}
          className="voice-topbar-btn px-1.5"
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
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--info)] animate-pulse" />
        <span className="hidden sm:inline">Connecting...</span>
        <span className="sm:hidden">Connecting</span>
      </button>
    );
  }

  // Connected / Live state
  if (voiceState === 'connected' || voiceState === 'live') {
    const isLive = voiceState === 'live' && !isMicMuted;
    return (
      <button
        type="button"
        onClick={onToggleMute}
        className={`voice-topbar-btn ${isLive ? 'is-live' : 'is-active'}`}
        aria-label={isLive ? 'Microphone on. Click to mute (Alt+M)' : 'Microphone muted. Click to speak (Alt+M)'}
        aria-pressed={!isMicMuted}
        title={isLive ? 'Mic live (Click or Alt+M to mute)' : 'Mic off (Click or Alt+M to talk)'}
      >
        {isLive ? <IconMic size={13} /> : <IconMicOff size={13} />}
        <span className="hidden sm:inline">{isLive ? VOICE_CONFIG.copy.micOn : VOICE_CONFIG.copy.micOff}</span>
        {isLive && (
          <AudioWaveBar level={speakingLevel} isLive={true} isOpponent={false} count={3} />
        )}
      </button>
    );
  }

  // Reconnecting state
  if (voiceState === 'reconnecting') {
    return (
      <button
        type="button"
        disabled
        className="voice-topbar-btn is-warn"
        aria-label="Voice reconnecting"
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--warn)] animate-pulse" />
        <span>Reconnecting</span>
      </button>
    );
  }

  // Failed state
  if (voiceState === 'failed') {
    return (
      <button
        type="button"
        onClick={onRequestVoice}
        className="voice-topbar-btn is-bad"
        aria-label="Voice connection failed. Click to retry"
        title="Voice connection failed. Click to retry"
      >
        <IconAlert size={12} />
        <span>Failed (Retry)</span>
      </button>
    );
  }

  // Ended state
  if (voiceState === 'ended') {
    return (
      <button
        type="button"
        onClick={onRequestVoice}
        className="voice-topbar-btn"
        aria-label="Voice ended. Click to request again"
        title="Voice ended. Click to request again"
      >
        <IconMic size={12} />
        <span>Voice Ended</span>
      </button>
    );
  }

  // Default Off state
  return (
    <button
      type="button"
      onClick={onRequestVoice}
      className="voice-topbar-btn"
      aria-label="Start voice communication with opponent"
      title={isOppPremium ? "Request voice chat" : "Your opponent needs Premium for voice"}
    >
      <IconMic size={13} />
      <span>Voice</span>
    </button>
  );
}

