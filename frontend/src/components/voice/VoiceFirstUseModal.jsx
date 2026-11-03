/**
 * frontend/src/components/voice/VoiceFirstUseModal.jsx
 *
 * One-time plain explanation dialog before first voice session.
 * Clarifies mutual consent, no recording, and instant muting/reporting.
 */

import React from 'react';
import { IconShield, IconMic, IconFlag, IconCheck } from './VoiceIcons';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceFirstUseModal({ isOpen, onContinue, onConfirm, onClose }) {
  if (!isOpen) return null;

  const handleProceed = onContinue || onConfirm;
  const continueBtnRef = React.useRef(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      continueBtnRef.current?.focus();
    }, 50);

    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleProceed?.();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleProceed, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-first-use-title"
      className="voice-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="voice-modal-frame">
        <div className="voice-modal-header">
          <div className="flex items-center gap-2">
            <IconMic size={16} className="text-[var(--info)]" />
            <h3 id="voice-first-use-title" className="voice-modal-title">
              {VOICE_CONFIG.copy.firstUseTitle}
            </h3>
          </div>
        </div>

        <div className="voice-modal-body">
          <p className="text-sm font-medium text-[var(--c-text)]">
            Live Voice enables real-time spoken communication with your match opponent.
          </p>

          <div className="flex flex-col gap-2.5 my-1">
            <div className="flex items-start gap-2.5">
              <IconShield size={16} className="text-[var(--ok)] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs text-[var(--c-text)]">Voice is never recorded</strong>
                <span className="text-xs text-[var(--c-text-dim)]">
                  Audio flows peer-to-peer over WebRTC. No audio tracks, transcripts, or recordings are stored.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <IconMic size={16} className="text-[var(--info)] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs text-[var(--c-text)]">Full mute control</strong>
                <span className="text-xs text-[var(--c-text-dim)]">
                  Your mic starts muted. Press Alt+M anytime to talk or mute. You can also mute your opponent locally.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <IconFlag size={16} className="text-[var(--warn)] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs text-[var(--c-text)]">Safety and blocking</strong>
                <span className="text-xs text-[var(--c-text-dim)]">
                  You can block voice from any opponent or report misconduct directly from the voice menu.
                </span>
              </div>
            </div>
          </div>

          <p className="font-mono text-[11px] text-[var(--c-text-mute)] border-t border-[var(--c-border)] pt-2.5">
            {VOICE_CONFIG.copy.safetyNotice}
          </p>
        </div>

        <div className="voice-modal-footer">
          <button
            type="button"
            ref={continueBtnRef}
            onClick={handleProceed}
            className="voice-btn-accept flex items-center gap-2 px-4"
          >
            <IconCheck size={14} />
            <span>{VOICE_CONFIG.copy.continueButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

