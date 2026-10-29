import React from 'react'
import { UserAvatar } from '../../utils/avatar'
import { getEloTier } from '../../utils/tierHelper'

function PlayIcon({ size = 11 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="4,2 14,8 4,14" />
    </svg>
  )
}

function CheckIcon({ size = 11 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  )
}

function SpinnerIcon({ size = 11 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="battle-v2__spin"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" strokeOpacity={0.25} />
      <path d="M14 8a6 6 0 0 0-6-6" />
    </svg>
  )
}

export default function EditorToolbarV2({
  player,
  user,
  verdict,
  progress,
  langs,
  lang,
  onLangChange,
  running,
  submitting,
  onRun,
  onSubmit,
}) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || '')
  const shortcutLabel = isMac ? '⌘↵' : 'Ctrl+↵'

  const verdictLabel =
    verdict === 'ACCEPTED'
      ? 'Accepted'
      : verdict === 'WRONG_ANSWER'
      ? 'Wrong Answer'
      : verdict === 'TIME_LIMIT_EXCEEDED'
      ? 'Time Limit'
      : verdict === 'RUNTIME_ERROR'
      ? 'Runtime Error'
      : verdict === 'COMPILATION_ERROR'
      ? 'Compilation Error'
      : verdict === 'PENDING' && progress
      ? `Judging ${progress.testIndex}/${progress.totalTests}`
      : null

  const verdictColor =
    verdict === 'ACCEPTED'
      ? 'var(--ok, #10b981)'
      : verdict === 'WRONG_ANSWER' || verdict === 'RUNTIME_ERROR' || verdict === 'COMPILATION_ERROR'
      ? 'var(--bad, #f43f5e)'
      : 'var(--warn, #f59e0b)'

  return (
    <div className="battle-v2__toolbar-wrap">
      {/* Upper sub-bar: Player Info & Status */}
      <div className="battle-v2__toolbar-player-row">
        <div className="flex items-center gap-2">
          <UserAvatar
            username={player?.username ?? user?.username}
            seed={player?.avatar_seed ?? user?.avatar_seed}
            style={player?.avatar_style ?? user?.avatar_style}
            size={20}
            isMe={true}
          />
          <span className="font-mono text-xs font-bold text-[#e2e8f4]">
            {player?.username ?? user?.username ?? 'You'}
          </span>
          <span className="battle-v2__you-tag">You</span>
          {(() => {
            const r = player?.rating ?? user?.elo_rating ?? 1200
            const t = getEloTier(r)
            return (
              <span
                className="battle-v2__tier-badge"
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

        {verdictLabel && (
          <div
            className="battle-v2__verdict-pill font-mono text-[10px] font-bold"
            style={{ color: verdictColor, borderColor: `${verdictColor}40` }}
          >
            {verdict === 'ACCEPTED' && <CheckIcon size={10} />}
            <span>{verdictLabel}</span>
          </div>
        )}
      </div>

      {/* Lower controls bar: Languages + Run & Submit */}
      <div className="battle-v2__toolbar-controls-row">
        {/* Language selector */}
        <div className="battle-v2__lang-group" role="tablist" aria-label="Programming Language">
          {langs.map((l) => {
            const active = lang === l.id
            return (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onLangChange(l.id)}
                className={`battle-v2__lang-btn ${active ? 'battle-v2__lang-btn--active' : ''}`}
              >
                <span>{l.label}</span>
              </button>
            )
          })}
        </div>

        {/* Action buttons */}
        <div className="battle-v2__toolbar-actions">
          <button
            id="run-btn"
            type="button"
            onClick={onRun}
            disabled={running || submitting}
            className="battle-v2__btn-run"
            title={`Run code (${shortcutLabel})`}
          >
            <PlayIcon size={10} />
            <span>{running ? 'Running...' : 'Run'}</span>
            <kbd className="battle-v2__kbd hidden sm:inline-block">{shortcutLabel}</kbd>
          </button>

          <button
            id="submit-btn"
            type="button"
            onClick={onSubmit}
            disabled={submitting || verdict === 'ACCEPTED'}
            className={`battle-v2__btn-submit ${verdict === 'ACCEPTED' ? 'battle-v2__btn-submit--accepted' : ''}`}
            title="Submit solution for judging"
          >
            {verdict === 'ACCEPTED' ? (
              <>
                <CheckIcon size={11} />
                <span>Accepted</span>
              </>
            ) : submitting ? (
              <>
                <SpinnerIcon size={11} />
                <span>{progress ? `${progress.testIndex}/${progress.totalTests}` : 'Judging...'}</span>
              </>
            ) : (
              <span>Submit</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

