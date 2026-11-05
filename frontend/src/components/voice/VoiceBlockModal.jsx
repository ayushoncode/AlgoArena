/**
 * frontend/src/components/voice/VoiceBlockModal.jsx
 *
 * Block player confirmation modal for Live Voice:
 * - 480px max width, 6px radius, hairline border, solid surface
 * - Plain copy, no emojis, no banned words
 */

import React, { useState } from 'react';
import api from '../../utils/api';
import { IconShield, IconClose } from './VoiceIcons';
import './voice.css';

export default function VoiceBlockModal({
  isOpen,
  opp,
  blockedUser,
  onBlocked,
  onClose,
}) {
  const opponent = opp || blockedUser;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleConfirmBlock() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/voice/block', {
        targetUserId: opponent?.userId || opponent?.id,
      });
      if (onBlocked) onBlocked();
      onClose?.();
    } catch (err) {
      console.error('[VoiceBlock] Block error:', err);
      setError('Failed to block player. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-block-title"
      className="voice-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="voice-modal-frame">
        {/* Header */}
        <div className="voice-modal-header">
          <div className="flex items-center gap-2">
            <IconShield size={16} className="text-[var(--bad)]" />
            <h3 id="voice-block-title" className="voice-modal-title">
              Block voice from this player
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="voice-modal-close-btn"
            aria-label="Close block dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="voice-modal-body space-y-4">
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Are you sure you want to block voice from <strong className="text-[var(--ink)]">{opponent?.username ?? 'Opponent'}</strong>?
          </p>
          <div className="p-3 rounded-md bg-[var(--bg-surface)] border border-[var(--hairline)] text-xs text-[var(--ink-muted)] leading-relaxed">
            You will not receive voice requests or hear audio from this player in future matches. Active voice in this match will disconnect immediately.
          </div>

          {error && (
            <div role="alert" className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-[var(--bad)] font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="voice-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="voice-btn-secondary h-11 px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmBlock}
            className="voice-btn-danger h-11 px-5"
          >
            {submitting ? 'Blocking...' : 'Block Voice'}
          </button>
        </div>
      </div>
    </div>
  );
}
