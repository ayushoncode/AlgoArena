/**
 * frontend/src/components/voice/IncomingVoicePrompt.jsx
 *
 * Non-modal consent prompt when the opponent requests Live Voice.
 * Pinned without causing editor layout shifts.
 * 44px tap targets, plain copy, countdown.
 */

import React, { useState, useEffect } from 'react';
import { IconMic, IconClose, IconCheck } from './VoiceIcons';
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
      <div className="flex items-center gap-2 min-w-0">
        <IconMic size={16} className="text-[var(--info)] shrink-0" />
        <div className="truncate">
          <span className="font-semibold text-xs text-[var(--ink)]">
            {opponentName} requested voice
          </span>
          <span className="font-mono text-[11px] text-[var(--ink-muted)] ml-2">
            ({countdown}s) · Voice is not recorded
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAccept}
          className="voice-btn-accept voice-btn-primary h-9 px-3 flex items-center gap-1.5"
          aria-label={`Accept voice request from ${opponentName}`}
        >
          <IconCheck size={14} />
          <span>Accept</span>
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="voice-btn-secondary h-9 px-3 flex items-center gap-1.5"
          aria-label={`Decline voice request from ${opponentName}`}
        >
          <IconClose size={13} />
          <span>Decline</span>
        </button>
      </div>
    </div>
  );
}
