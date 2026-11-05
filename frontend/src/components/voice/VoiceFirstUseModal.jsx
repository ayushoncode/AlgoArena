/**
 * frontend/src/components/voice/VoiceFirstUseModal.jsx
 *
 * First-use consent dialog for Live Voice in Duels:
 * - 480px max width, 6px radius, hairline border, solid surface (no backdrop blur)
 * - Exact plain copy without marketing buzzwords, emojis, or Lucide
 * - Single primary "Continue" button using design tokens (no green)
 */

import React, { useEffect, useRef } from 'react';
import { IconShield, IconMic, IconFlag, IconCheck } from './VoiceIcons';
import './voice.css';

export default function VoiceFirstUseModal({ isOpen, onContinue, onConfirm, onClose }) {
  if (!isOpen) return null;

  const handleProceed = onContinue || onConfirm;
  const continueBtnRef = useRef(null);

  useEffect(() => {
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
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="voice-modal-frame">
        {/* Header */}
        <div className="voice-modal-header">
          <div className="flex items-center gap-2">
            <IconMic size={16} className="text-[var(--info)]" />
            <h3 id="voice-first-use-title" className="voice-modal-title">
              Live Voice in Duels
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="voice-modal-body space-y-4">
          <p className="text-sm font-medium text-[var(--ink)]">
            Live Voice enables real-time spoken communication with your match opponent.
          </p>

          <div className="flex flex-col gap-3 my-1">
            {/* Bullet 1 */}
            <div className="flex items-start gap-3">
              <IconShield size={16} className="text-[var(--ink-muted)] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-[var(--ink)]">
                  Voice is never recorded
                </strong>
                <span className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  Audio flows peer-to-peer over WebRTC. No audio tracks, transcripts, or recordings are stored.
                </span>
              </div>
            </div>

            {/* Bullet 2 */}
            <div className="flex items-start gap-3">
              <IconMic size={16} className="text-[var(--info)] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-[var(--ink)]">
                  Full mute control
                </strong>
                <span className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  Your mic starts muted. Press Alt+M anytime to talk or mute. You can also mute your opponent locally.
                </span>
              </div>
            </div>

            {/* Bullet 3 */}
            <div className="flex items-start gap-3">
              <IconFlag size={16} className="text-[var(--warn)] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-[var(--ink)]">
                  Safety and blocking
                </strong>
                <span className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  You can block voice from any opponent or report misconduct directly from the voice menu.
                </span>
              </div>
            </div>
          </div>

          <p className="font-mono text-[11px] text-[var(--ink-faint)] border-t border-[var(--hairline)] pt-3">
            You can mute or block anyone at any time.
          </p>
        </div>

        {/* Footer */}
        <div className="voice-modal-footer">
          <button
            type="button"
            ref={continueBtnRef}
            onClick={handleProceed}
            className="voice-btn-primary voice-btn-accept flex items-center justify-center gap-2 px-5 h-11"
          >
            <IconCheck size={14} />
            <span>Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
