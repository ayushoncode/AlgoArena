/**
 * frontend/src/components/voice/VoiceReportModal.jsx
 *
 * Safety report dialog for Live Voice sessions:
 * - 480px max width on desktop, full-width bottom sheet on phone, 6px radius, hairline border
 * - Reasons displayed as accessible radio buttons
 * - Optional 140-char text box with mono character counter
 * - "Cancel" and "Submit report" buttons
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
  reportedUser,
  matchId,
  onClose,
}) {
  const opponent = opp || reportedUser;
  const matchRoomId = roomId || matchId;

  const categories = VOICE_CONFIG.reportCategories || [
    { id: 'harassment', label: 'Harassment or hate speech' },
    { id: 'disruption', label: 'Noise or intentional disruption' },
    { id: 'threats', label: 'Threats or dangerous behaviour' },
    { id: 'other', label: 'Other misconduct' },
  ];

  const [category, setCategory] = useState(categories[0]?.id || 'harassment');
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
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validMatchId = matchRoomId && uuidRegex.test(matchRoomId) ? matchRoomId : null;
      await api.post('/api/voice/report', {
        targetUserId: opponent?.userId || opponent?.id,
        matchId: validMatchId,
        category,
        note: note.slice(0, 140),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setNote('');
        onClose?.();
      }, 500);
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
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="voice-modal-frame">
        {/* Header */}
        <div className="voice-modal-header">
          <div className="flex items-center gap-2">
            <IconFlag size={16} className="text-[var(--warn)]" />
            <h3 id="voice-report-title" className="voice-modal-title">
              Report voice
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="voice-modal-close-btn"
            aria-label="Close report dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <IconCheck size={28} className="text-[var(--ok)]" />
            <p className="font-semibold text-sm text-[var(--ink)]">Report submitted</p>
            <p className="font-mono text-xs text-[var(--ink-muted)]">
              Thank you for helping keep AlgoArena safe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="voice-modal-body space-y-4">
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Reporting <strong className="text-[var(--ink)]">{opponent?.username ?? 'Opponent'}</strong>.
                Reports log the match timestamp and reason category. Voice audio is not stored.
              </p>

              {error && (
                <div role="alert" className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-[var(--bad)] font-mono">
                  {error}
                </div>
              )}

              {/* Reasons as radio buttons */}
              <fieldset className="space-y-2">
                <legend className="voice-select-label mb-2">Select a reason</legend>
                <div className="space-y-2">
                  {categories.map((c) => (
                    <label
                      key={c.id}
                      className={`voice-radio-card flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                        category === c.id
                          ? 'border-[var(--info)] bg-[var(--bg-surface)] text-[var(--ink)]'
                          : 'border-[var(--hairline)] bg-[var(--bg-elevated)] text-[var(--ink-muted)] hover:border-[var(--ink-faint)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={c.id}
                        checked={category === c.id}
                        onChange={(e) => setCategory(e.target.value)}
                        className="accent-[var(--info)]"
                      />
                      <span className="text-xs font-medium">{c.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Optional 140-char text box with mono counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5 font-mono text-[11px] text-[var(--ink-muted)]">
                  <span>Additional details (optional)</span>
                  <span className="tabular-nums">{note.length}/140</span>
                </div>
                <textarea
                  id="report-note"
                  rows={3}
                  maxLength={140}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe what occurred (up to 140 characters)..."
                  className="w-full p-2.5 rounded-md bg-[var(--bg-base)] border border-[var(--hairline)] text-xs text-[var(--ink)] font-sans outline-none focus:border-[var(--info)] resize-none"
                />
              </div>
            </div>

            {/* Footer with Cancel and Submit report */}
            <div className="voice-modal-footer">
              <button
                type="button"
                onClick={onClose}
                className="voice-btn-secondary h-11 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="voice-btn-primary h-11 px-5"
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
