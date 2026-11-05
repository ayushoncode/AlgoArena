import React from 'react'
import TopBarV2 from './TopBarV2'
import ConnectionBannerV2 from './ConnectionBannerV2'
import ResignModalV2 from './ResignModalV2'
import ProblemPanelV2 from './ProblemPanelV2'
import RivalPanelV2 from './RivalPanelV2'
import { getEloTier } from '../../utils/tierHelper'
import './battle-v2.css'

export default function BattleRoomV2({
  // TopBar
  topic,
  difficulty,
  roomId,
  timerDisplay,
  remaining,
  me,
  opp,
  user,
  // Connection
  connected,
  // Resign modal
  showResignModal,
  onCloseResign,
  onConfirmResign,
  onOpenResign,
  // Problem panel
  problemId,
  probPanelWidth,
  probCollapsed,
  onToggleCollapse,
  onProblemLoaded,
  onMouseDownProb,
  onResetProbWidth,
  // Rival panel
  oppVerdict,
  oppProgress,
  oppDisconnectState,
  oppPanelWidth,
  onMouseDownOpp,
  onResetOppWidth,
  // Mobile tab state
  mobileTab,
  setMobileTab,
  // Voice integration (additive props)
  voiceControl,
  voiceDock,
  voiceIncomingPrompt,
  voiceErrorBanner,
  voiceSlotForRival,
  voiceMobileStrip,
  isOpponentSpeaking,
  // Editor slot
  children,
}) {
  const myRating = me?.rating ?? user?.elo_rating ?? 1200
  const myTier = getEloTier(myRating)

  return (
    <div
      className="battle-v2"
      style={{
        '--tier-color': myTier.color,
        '--tier-bg': myTier.bg,
        '--tier-border': myTier.border,
      }}
    >
      {/* Top Bar */}
      <TopBarV2
        topic={topic}
        difficulty={difficulty}
        roomId={roomId}
        timerDisplay={timerDisplay}
        remaining={remaining}
        me={me}
        opp={opp}
        user={user}
        onOpenResign={onOpenResign}
        voiceControl={voiceControl}
        voiceDock={voiceDock}
      />

      {/* Connection State Banner */}
      <ConnectionBannerV2 connected={connected} />

      {/* Voice Error Banner */}
      {voiceErrorBanner && (
        <div className="shrink-0 px-3 py-1.5 bg-rose-500/10 border-b border-rose-500/30 text-[var(--bad)] text-xs font-mono flex items-center justify-between">
          {voiceErrorBanner}
        </div>
      )}

      {/* Non-modal Incoming Voice Toast (Pinned top-right, zero editor layout reflow) */}
      {voiceIncomingPrompt && (
        <div className="absolute top-[52px] right-3 z-30 max-w-sm rounded-md shadow-xl border border-[var(--hairline)] bg-[var(--bg-elevated)] overflow-hidden">
          {voiceIncomingPrompt}
        </div>
      )}

      {/* Resign Confirmation Modal */}
      <ResignModalV2
        isOpen={showResignModal}
        onClose={onCloseResign}
        onConfirm={onConfirmResign}
      />

      {/* Mobile navigation tabs */}
      <div className="flex md:hidden items-center px-2 py-1.5 shrink-0 bg-[var(--bg-elevated)] border-b border-[var(--hairline)] gap-2">
        {[
          { id: 'problem', label: 'Problem' },
          { id: 'editor', label: 'Code' },
          { id: 'opponent', label: 'Rival' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMobileTab(t.id)}
            className="font-mono text-[11px] px-3 py-1 font-semibold uppercase transition-colors rounded-sm"
            style={{
              backgroundColor: mobileTab === t.id ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: mobileTab === t.id ? 'var(--info, #38bdf8)' : 'var(--ink-muted, #94a3b8)',
              borderBottom: mobileTab === t.id ? '2px solid var(--info, #38bdf8)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main 3-pane Workspace */}
      <div className="battle-v2__workspace">
        {/* Left: Problem Panel */}
        <div
          className={`${mobileTab === 'problem' ? 'flex absolute inset-0 z-10 w-full' : 'hidden'
            } md:flex flex-col shrink-0 md:relative md:z-auto`}
          style={{
            width: probCollapsed ? 40 : probPanelWidth,
            minWidth: probCollapsed ? 40 : 220,
          }}
        >
          <ProblemPanelV2
            problemId={problemId}
            topic={topic}
            difficulty={difficulty}
            forcedWidth={probPanelWidth}
            collapsed={probCollapsed}
            onToggleCollapse={onToggleCollapse}
            onProblemLoaded={onProblemLoaded}
          />
        </div>

        {/* Divider 1: Problem | Editor */}
        <div
          className="battle-v2__divider hidden md:flex"
          onMouseDown={onMouseDownProb}
          onDoubleClick={onResetProbWidth}
          title="Drag to resize problem panel (double-click to reset)"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="battle-v2__divider-bar" />
        </div>

        {/* Center: Editor Panel */}
        <div
          className={`${mobileTab === 'editor' ? 'flex absolute inset-0 z-10 w-full' : 'hidden'
            } md:flex flex-col flex-1 min-w-0 md:relative md:z-auto`}
        >
          {/* Mobile in-flow 40px voice strip in code tab */}
          {voiceMobileStrip && (
            <div className="md:hidden shrink-0">
              {voiceMobileStrip}
            </div>
          )}
          {children}
        </div>

        {/* Divider 2: Editor | Rival */}
        <div
          className="battle-v2__divider hidden md:flex"
          onMouseDown={onMouseDownOpp}
          onDoubleClick={onResetOppWidth}
          title="Drag to resize rival panel (double-click to reset)"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="battle-v2__divider-bar" />
        </div>

        {/* Right: Rival Panel */}
        <div
          className={`${mobileTab === 'opponent' ? 'flex absolute inset-0 z-10 w-full' : 'hidden'
            } md:flex flex-col shrink-0 md:relative md:z-auto`}
          style={{
            width: Math.max(260, oppPanelWidth || 260),
            minWidth: 260,
          }}
        >
          <RivalPanelV2
            opp={opp}
            oppVerdict={oppVerdict}
            oppProgress={oppProgress}
            oppDisconnectState={oppDisconnectState}
            width={oppPanelWidth}
            voiceSlot={voiceSlotForRival}
            isOpponentSpeaking={isOpponentSpeaking}
          />
        </div>
      </div>

      {/* Rank-tier Ground Progress Line (bottom) */}
      <div
        className="battle-v2__ground-line"
        role="progressbar"
        aria-valuenow={Math.round(((1800 - remaining) / 1800) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Match timer ground progress"
      >
        <div
          className="battle-v2__ground-progress"
          style={{
            width: `${Math.max(0, Math.min(100, ((1800 - remaining) / 1800) * 100))}%`,
          }}
        />
      </div>
    </div>
  )
}
