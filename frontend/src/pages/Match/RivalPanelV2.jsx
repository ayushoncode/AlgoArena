import React from 'react'
import { UserAvatar } from '../../utils/avatar'
import { getEloTier } from '../../utils/tierHelper'

function CheckCircleIcon({ size = 16, className = '' }) {
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
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 8l2 2 3.5-3.5" />
    </svg>
  )
}

function AlertIcon({ size = 16, className = '' }) {
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
      className={className}
      aria-hidden="true"
    >
      <path d="M8 2l6.5 12H1.5L8 2z" />
      <path d="M8 6.5v3" />
      <circle cx="8" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function RivalPanelV2({
  opp,
  oppVerdict,
  oppProgress,
  oppDisconnectState,
  width,
  voiceSlot,
}) {
  const isTyping = oppProgress?.isTyping
  const lineCount = oppProgress?.lineCount || 1
  const charCount = oppProgress?.charCount || 0
  const progressPercent = Math.min(100, Math.max(5, lineCount * 3))

  return (
    <aside
      className="battle-v2__rival-panel"
      style={{
        width: '100%',
        minWidth: '100%',
        height: '100%',
      }}
      aria-label="Rival Workspace"
    >
      {/* Header */}
      <div className="battle-v2__rival-header">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserAvatar
            username={opp?.username}
            seed={opp?.avatar_seed}
            style={opp?.avatar_style}
            size={18}
            isMe={false}
          />
          <span
            className="font-mono text-xs font-bold truncate max-w-[70px]"
            style={{ color: 'var(--info, #38bdf8)' }}
            title={opp?.username ?? 'Opponent'}
          >
            {opp?.username ?? 'Opponent'}
          </span>
        </div>
        {(() => {
          const r = opp?.rating ?? 1200
          const t = getEloTier(r)
          return (
            <span
              className="battle-v2__tier-badge shrink-0"
              style={{
                color: t.color,
                borderColor: t.border,
                backgroundColor: t.bg,
              }}
              title={`${t.name} (${r})`}
            >
              <t.Mark size={10} />
              <span>{t.code}</span>
              <span className="opacity-60">·</span>
              <span>{r}</span>
            </span>
          )
        })()}
      </div>

      {/* Body */}
      <div className="battle-v2__rival-body">
        {voiceSlot && (
          <div className="w-full mb-3 flex justify-center">
            {voiceSlot}
          </div>
        )}
        {oppDisconnectState ? (
          <div
            className="p-3 w-full border text-center rounded space-y-1.5"
            style={{
              borderColor: 'rgba(244, 63, 94, 0.35)',
              backgroundColor: 'rgba(244, 63, 94, 0.06)',
            }}
          >
            <AlertIcon size={18} className="mx-auto text-[var(--bad)]" />
            <p className="font-mono text-xs font-bold" style={{ color: 'var(--bad, #f43f5e)' }}>
              Disconnected
            </p>
            <p className="font-mono text-[10px] text-[var(--c-text-mute)]">Grace period:</p>
            <p className="font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--bad, #f43f5e)' }}>
              {oppDisconnectState.countdown}s
            </p>
          </div>
        ) : oppVerdict === 'ACCEPTED' ? (
          <div className="space-y-2 text-center">
            <CheckCircleIcon size={22} className="mx-auto" style={{ color: 'var(--info, #38bdf8)' }} />
            <p className="font-mono text-xs font-bold" style={{ color: 'var(--info, #38bdf8)' }}>
              Solved it!
            </p>
            <p className="font-mono text-[10px] text-[var(--c-text-mute)]">Match ending...</p>
          </div>
        ) : oppVerdict === 'PENDING' ? (
          <div className="space-y-2 text-center">
            <div className="flex gap-1 justify-center items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)] opacity-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)] opacity-50" />
            </div>
            <p className="font-mono text-xs font-semibold" style={{ color: 'var(--info, #38bdf8)' }}>
              Judging...
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Status line */}
            <div className="battle-v2__rival-status-badge">
              <span className="battle-v2__status-dot" />
              <span>{isTyping ? 'Typing...' : 'Coding'}</span>
            </div>

            {/* Test progress or lines & chars */}
            {oppProgress ? (
              <div className="battle-v2__rival-progress-box">
                <div className="flex justify-between text-[var(--c-text-dim)]">
                  <span>Lines:</span>
                  <span className="font-bold text-[var(--info)]">{lineCount}</span>
                </div>
                <div className="flex justify-between text-[var(--c-text-dim)] mt-1">
                  <span>Chars:</span>
                  <span className="font-bold text-[var(--info)]">{charCount}</span>
                </div>
                <div className="battle-v2__rival-bar">
                  <div
                    className="battle-v2__rival-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}

            <p className="battle-v2__rival-placeholder">
              Rival's code is hidden until they submit
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

