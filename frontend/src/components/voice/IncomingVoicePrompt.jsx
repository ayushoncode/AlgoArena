/**
 * frontend/src/components/voice/IncomingVoicePrompt.jsx
 *
 * Prominent consent prompt when the opponent requests Live Voice.
 * Shows Accept and Decline buttons with 30-second countdown and privacy note.
 */

import React, { useState, useEffect } from 'react';
import { IconMic, IconClose, IconCheck } from './VoiceIcons';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function IncomingVoicePrompt({
  opponentName = 'Opponent',
  requestExpiresAt,
  onAccept,
  onDecline,
}) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!requestExpiresAt) return;

    function update() {
      const remainingMs = Math.max(0, requestExpiresAt - Date.now());
      setCountdown(Math.ceil(remainingMs / 1000));
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [requestExpiresAt]);

  return (
    <div
      role="region"
      aria-label="Incoming voice call request"
      className="voice-incoming-bar"
    >
      <div className="flex items-center gap-2">
        <IconMic size={16} className="text-[var(--info)] shrink-0" />
        <div>
          <span className="font-semibold text-xs text-[var(--c-text)]">
            {opponentName} requested voice
          </span>
          <span className="font-mono text-[10px] text-[var(--c-text-mute)] ml-2">
            ({countdown}s) · {VOICE_CONFIG.copy.privacyNotice}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAccept}
          className="voice-btn-accept flex items-center gap-1.5"
          aria-label={`Accept voice request from ${opponentName}`}
        >
          <IconCheck size={13} />
          <span>{VOICE_CONFIG.copy.accept}</span>
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="voice-btn-decline flex items-center gap-1"
          aria-label={`Decline voice request from ${opponentName}`}
        >
          <IconClose size={13} />
          <span>{VOICE_CONFIG.copy.decline}</span>
        </button>
      </div>
    </div>
  );
}

