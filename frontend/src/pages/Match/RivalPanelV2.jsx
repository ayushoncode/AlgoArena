/**
 * frontend/src/pages/Match/RivalPanelV2.jsx
 *
 * Presentational Rival Panel for Battle Room (Desktop and Tablet Landscape ~280px wide):
 * 1. Rival header: 40px avatar with 4px radius, username, rating in gold mono,
 *    muted status line ("Coding", "Submitted", "Disconnected", "Reconnecting").
 *    2px ink ring surrounds avatar when opponent speaks (static under reduced motion).
 * 2. VOICE ROW directly under the header: 44px tall, hairline top and bottom (no card box).
 * 3. RIVAL WORKSPACE section: definition list under the label "Rival" showing only exposed fields,
 *    plus the lock note "Their code stays hidden until they submit."
 */

import React from 'react';
import { UserAvatar } from '../../utils/avatar';
import { getEloTier } from '../../utils/tierHelper';

function LockIcon({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  );
}

function AlertIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2l6.5 12H1.5L8 2z" />
      <path d="M8 6.5v3" />
      <circle cx="8" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function RivalPanelV2({
  opp,
  oppVerdict,
  oppProgress,
  oppDisconnectState,
  width,
  voiceSlot,
  isOpponentSpeaking = false,
}) {
  const isTyping = oppProgress?.isTyping;
  const rating = opp?.rating ?? 1200;
  const tier = getEloTier(rating);

  // Derive single status sentence for header
  let statusText = 'Coding';
  if (oppDisconnectState) {
    statusText = 'Disconnected';
  } else if (oppVerdict === 'ACCEPTED') {
    statusText = 'Submitted';
  } else if (oppVerdict === 'PENDING') {
    statusText = 'Judging';
  } else if (isTyping) {
    statusText = 'Coding';
  }

  // Exposed workspace fields
  const exposedLanguage = oppProgress?.lang || opp?.language;
  const exposedSubmissions = oppProgress?.submissions || opp?.submissionCount;
  const testsPassed = oppProgress?.testsPassed; // e.g. "7 of 12" or { passed: 7, total: 12 }
  const testsPassedText = typeof testsPassed === 'string'
    ? testsPassed
    : testsPassed?.total
    ? `${testsPassed.passed} of ${testsPassed.total}`
    : null;
  const testPercent = testsPassed?.total
    ? Math.round((testsPassed.passed / testsPassed.total) * 100)
    : 0;

  return (
    <aside
      className="battle-v2__rival-panel flex flex-col h-full w-full bg-[var(--bg-base)] text-[var(--ink)]"
      style={{
        width: '100%',
        minWidth: '100%',
      }}
      aria-label="Rival Workspace"
    >
      {/* 1. Rival Header */}
      <div className="battle-v2__rival-header flex items-center justify-between p-3 border-b border-[var(--hairline)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* 40px Avatar with 4px radius & 2px ink ring when speaking */}
          <div
            className={`rival-avatar-wrap ${isOpponentSpeaking ? 'is-speaking' : ''} rounded-[4px] shrink-0`}
            style={{ width: 40, height: 40 }}
          >
            <UserAvatar
              username={opp?.username}
              seed={opp?.avatar_seed}
              style={opp?.avatar_style}
              size={40}
              isMe={false}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="font-medium text-xs truncate max-w-[110px] text-[var(--ink)]"
                title={opp?.username ?? 'Opponent'}
              >
                {opp?.username ?? 'Opponent'}
              </span>
              {/* Rating in gold mono */}
              <span
                className="font-mono text-xs font-bold shrink-0 text-[var(--accent)]"
                title={`Rating: ${rating}`}
              >
                {rating}
              </span>
            </div>

            {/* Muted single status line */}
            <p className="font-mono text-[11px] text-[var(--ink-muted)] truncate">
              {statusText}
            </p>
          </div>
        </div>

        {/* Tier code badge */}
        <span
          className="battle-v2__tier-badge shrink-0"
          style={{
            color: tier.color,
            borderColor: 'var(--hairline)',
            backgroundColor: 'var(--bg-surface)',
          }}
          title={`${tier.name} (${rating})`}
        >
          <tier.Mark size={10} />
          <span className="font-bold">{tier.code}</span>
        </span>
      </div>

      {/* 2. VOICE ROW directly under header (44px tall, hairline top and bottom) */}
      {voiceSlot && (
        <div className="w-full shrink-0">
          {voiceSlot}
        </div>
      )}

      {/* Disconnect Alert (if active) */}
      {oppDisconnectState && (
        <div className="m-3 p-3 rounded border border-rose-500/30 bg-rose-500/10 text-center space-y-1">
          <AlertIcon size={16} className="mx-auto text-[var(--bad)]" />
          <p className="font-mono text-xs font-bold text-[var(--bad)]">
            Rival Disconnected
          </p>
          <p className="font-mono text-[11px] text-[var(--ink-muted)]">
            Grace period remaining: <span className="text-[var(--bad)] font-bold">{oppDisconnectState.countdown}s</span>
          </p>
        </div>
      )}

      {/* 3. RIVAL WORKSPACE Section (definition list under label "Rival") */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2">
          Rival
        </div>
        <dl className="space-y-2.5">
          {/* Status Row */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--hairline-subtle)]">
            <dt className="text-[var(--ink-muted)]">Status</dt>
            <dd className="font-mono font-medium text-[var(--ink)]">
              {oppVerdict === 'ACCEPTED'
                ? 'Solved it!'
                : oppVerdict === 'PENDING'
                ? 'Judging...'
                : isTyping
                ? 'Typing...'
                : 'Coding'}
            </dd>
          </div>

          {/* Language (if exposed) */}
          {exposedLanguage && (
            <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--hairline-subtle)]">
              <dt className="text-[var(--ink-muted)]">Language</dt>
              <dd className="font-mono text-[var(--ink)]">{exposedLanguage}</dd>
            </div>
          )}

          {/* Submissions (if exposed) */}
          {exposedSubmissions != null && (
            <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--hairline-subtle)]">
              <dt className="text-[var(--ink-muted)]">Submissions</dt>
              <dd className="font-mono text-[var(--ink)]">{exposedSubmissions}</dd>
            </div>
          )}

          {/* Tests passed (if exposed after a submit) */}
          {testsPassedText && (
            <div className="py-1 border-b border-[var(--hairline-subtle)] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <dt className="text-[var(--ink-muted)]">Tests passed</dt>
                <dd className="font-mono text-[var(--info)]">{testsPassedText}</dd>
              </div>
              <div className="h-0.5 w-full bg-[var(--hairline)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--info)]"
                  style={{ width: `${testPercent}%` }}
                />
              </div>
            </div>
          )}
        </dl>

        {/* Lock Note */}
        <div className="flex items-center gap-1.5 pt-2 text-xs text-[var(--ink-muted)]">
          <LockIcon size={12} className="shrink-0 text-[var(--ink-faint)]" />
          <span>Their code stays hidden until they submit.</span>
        </div>
      </div>
    </aside>
  );
}
