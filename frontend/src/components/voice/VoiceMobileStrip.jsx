/**
 * frontend/src/components/voice/VoiceMobileStrip.jsx
 *
 * In-flow strip in the Code tab on phones while connected:
 * - 40px high strip pinned just above or below the Run and Submit bar
 * - Never overlaps or hides editor lines, cursor, or Run button
 * - Mic toggle, opponent volume quick-tap (mute/unmute), "End" button
 */

import React from 'react';
import {
  IconMic,
  IconMicOff,
  IconPhoneOff,
  IconSpeaker,
} from './VoiceIcons';
import './voice.css';

export default function VoiceMobileStrip({
  isMicMuted = true,
  isOpponentMutedLocally = false,
  onToggleMute,
  onToggleOpponentMute,
  onEndVoice,
}) {
  return (
    <div
      className="voice-mobile-strip"
      role="region"
      aria-label="Active voice controls for mobile code tab"
    >
      <div className="flex items-center gap-2">
        {/* Mic toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={!isMicMuted}
          className={`voice-mobile-strip__btn ${!isMicMuted ? 'is-live' : 'is-muted'}`}
          aria-label={isMicMuted ? 'Microphone is off. Tap to talk' : 'Microphone is live. Tap to mute'}
        >
          {!isMicMuted ? <IconMic size={15} /> : <IconMicOff size={15} />}
          <span className="font-mono text-xs">{!isMicMuted ? 'Mic on' : 'Mic off'}</span>
        </button>

        {/* Quick tap mute opponent */}
        <button
          type="button"
          onClick={onToggleOpponentMute}
          className="voice-mobile-strip__btn"
          aria-label={isOpponentMutedLocally ? 'Unmute opponent' : 'Mute opponent'}
          title="Toggle opponent audio"
        >
          <IconSpeaker size={15} className={isOpponentMutedLocally ? 'text-[var(--bad)]' : 'text-[var(--ink-muted)]'} />
          <span className="font-mono text-xs">
            {isOpponentMutedLocally ? 'Muted' : 'Volume'}
          </span>
        </button>
      </div>

      {/* End call */}
      <button
        type="button"
        onClick={onEndVoice}
        className="voice-mobile-strip__end-btn"
        aria-label="End voice call"
      >
        <IconPhoneOff size={14} />
        <span>End</span>
      </button>
    </div>
  );
}

