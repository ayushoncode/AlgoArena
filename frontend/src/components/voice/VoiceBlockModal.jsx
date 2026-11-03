/**
 * frontend/src/components/voice/VoiceBlockModal.jsx
 *
 * Block player confirmation modal for Live Voice.
 * Blocks are enforced server-side; blocked pairs never receive voice requests.
 */

import React, { useState } from 'react';
import api from '../../utils/api';
import { IconShield, IconClose, IconCheck } from './VoiceIcons';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceBlockModal({
  isOpen,
  opp,
  onBlocked,
  onClose,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleConfirmBlock() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/voice/block', {
        targetUserId: opp?.id || opp?.userId,
      });
      if (onBlocked) onBlocked();
      onClose();
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="voice-modal-frame">
        <div className="voice-modal-header">
          <div className="flex items-center gap-2">
            <IconShield size={16} className="text-[var(--bad)]" />
            <h3 id="voice-block-title" className="voice-modal-title">
              {VOICE_CONFIG.copy.blockPlayer}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="voice-modal-close-btn"
            aria-label="Close voice block dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="voice-modal-body">
          <p className="text-xs text-[var(--c-text)]">
            Are you sure you want to block voice communication from <strong className="text-[var(--bad)]">{opp?.username ?? 'this player'}</strong>?
          </p>

          <p className="text-xs text-[var(--c-text-dim)]">
            Neither you nor this player will be able to initiate or receive voice requests in future matches. This block is saved to your account.
          </p>

          {error && (
            <div role="alert" className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-[var(--bad)]">
              {error}
            </div>
          )}
        </div>

        <div className="voice-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="voice-btn-decline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmBlock}
            disabled={submitting}
            className="voice-btn-accept is-bad bg-[var(--bad)] border-[var(--bad)] text-white px-4"
          >
            {submitting ? 'Blocking...' : 'Block Voice'}
          </button>
        </div>
      </div>
    </div>
  );
}

