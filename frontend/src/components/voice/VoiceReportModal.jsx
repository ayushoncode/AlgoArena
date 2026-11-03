/**
 * frontend/src/components/voice/VoiceReportModal.jsx
 *
 * Safety report dialog for Live Voice sessions.
 * Collects category and optional note (up to 500 chars). Does not record audio.
 */

import React, { useState } from 'react';
import api from '../../utils/api';
import { IconFlag, IconClose, IconCheck } from './VoiceIcons';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceReportModal({
  isOpen,
  opp,
  roomId,
  onClose,
}) {
  const [category, setCategory] = useState(VOICE_CONFIG.reportCategories[0]?.id || 'harassment');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/voice/report', {
        targetUserId: opp?.id || opp?.userId,
        matchId: roomId,
        category,
        note: note.slice(0, 500),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setNote('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[VoiceReport] Submission error:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-report-title"
      className="voice-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="voice-modal-frame">
        <div className="voice-modal-header">
          <div className="flex items-center gap-2">
            <IconFlag size={16} className="text-[var(--warn)]" />
            <h3 id="voice-report-title" className="voice-modal-title">
              {VOICE_CONFIG.copy.reportVoice}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="voice-modal-close-btn"
            aria-label="Close voice report dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <IconCheck size={24} className="text-[var(--ok)]" />
            <p className="font-semibold text-sm text-[var(--c-text)]">Report submitted</p>
            <p className="font-mono text-xs text-[var(--c-text-mute)]">Thank you for helping keep AlgoArena safe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="voice-modal-body">
              <p className="text-xs text-[var(--c-text-dim)]">
                Reporting player <strong className="text-[var(--c-text)]">{opp?.username ?? 'Opponent'}</strong>.
                Reports log the UTC time window and reason. {VOICE_CONFIG.copy.privacyNotice}
              </p>

              {error && (
                <div role="alert" className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-[var(--bad)]">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="report-category" className="voice-select-label">
                  Reason category
                </label>
                <select
                  id="report-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="voice-select"
                >
                  {VOICE_CONFIG.reportCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report-note" className="voice-select-label flex justify-between">
                  <span>Additional details (optional)</span>
                  <span>{note.length}/500</span>
                </label>
                <textarea
                  id="report-note"
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe the incident..."
                  className="w-full p-2 rounded bg-[var(--c-void)] border border-[var(--c-border)] text-xs text-[var(--c-text)] font-sans outline-none focus:border-[var(--info)] resize-none"
                />
              </div>
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
                type="submit"
                disabled={submitting}
                className="voice-btn-accept px-4"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

