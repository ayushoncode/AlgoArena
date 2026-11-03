/**
 * frontend/src/components/voice/VoiceDock.jsx
 *
 * Connected voice dock with:
 * - 44px microphone mute toggle button ("Mic off" / "Mic on")
 * - Opponent avatar active speaking indicator (2px ink ring, zero glow)
 * - Connection quality telemetry indicator (three bars + Good/Fair/Poor + tooltip)
 * - Overflow menu (volume slider, mute opponent, block, report, settings, end call)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  IconMic,
  IconMicOff,
  IconSpeaker,
  IconPhoneOff,
  IconSliders,
  IconFlag,
  IconShield,
  IconMoreVertical,
} from './VoiceIcons';
import { UserAvatar } from '../../utils/avatar';
import AudioWaveBar from './AudioWaveBar';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceDock({
  opp,
  isMicMuted,
  isOpponentSpeaking,
  speakingLevel = 0,
  opponentSpeakingLevel = 0,
  quality,
  outputVolume,
  isOpponentMutedLocally,
  onToggleMute,
  onToggleOpponentMute,
  onChangeVolume,
  onOpenSettings,
  onOpenReport,
  onOpenBlock,
  onEndVoice,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close overflow menu on outside click or Escape
  useEffect(() => {
    if (!showMenu) return;
    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setShowMenu(false);
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showMenu]);

  const rating = quality?.rating || 'good';
  const qualityClass = rating === 'poor' ? 'is-poor' : rating === 'fair' ? 'is-fair' : 'is-good';
  const qualityLabel = rating === 'poor' ? 'Poor' : rating === 'fair' ? 'Fair' : 'Good';
  const qualityTooltip = `RTT: ${quality?.rtt || 0}ms · Jitter: ${quality?.jitter || 0}ms · Loss: ${quality?.packetLoss || 0}% · Bitrate: ${Math.round((quality?.bitrate || 0) / 1000)} kbps`;

  return (
    <div className="voice-dock" role="region" aria-label="Live Voice Call Controls">
      {/* 44px Mic Mute Button */}
      <button
        type="button"
        onClick={onToggleMute}
        className={`voice-dock__mute-btn ${isMicMuted ? 'is-muted' : 'is-live'}`}
        aria-label={isMicMuted ? 'Microphone is muted. Click or press Alt+M to speak' : 'Microphone is live. Click or press Alt+M to mute'}
        aria-pressed={!isMicMuted}
        title="Toggle Microphone (Alt+M)"
      >
        {isMicMuted ? <IconMicOff size={16} /> : <IconMic size={16} />}
        <span>{isMicMuted ? VOICE_CONFIG.copy.micOff : VOICE_CONFIG.copy.micOn}</span>
        {!isMicMuted && (
          <AudioWaveBar level={speakingLevel} isLive={true} isOpponent={false} count={5} />
        )}
      </button>

      {/* Opponent Speaking Ring & Name */}
      <div className="flex items-center gap-2 pl-1 pr-2 border-r border-[var(--c-border)]">
        <div className="voice-speaker-wrap">
          <UserAvatar
            username={opp?.username}
            seed={opp?.avatar_seed}
            style={opp?.avatar_style}
            size={24}
            isMe={false}
          />
          {isOpponentSpeaking && (
            <div className="voice-speaker-ring is-speaking" aria-hidden="true" />
          )}
        </div>
        <span
          className="font-mono text-xs font-semibold truncate max-w-[80px] text-[var(--c-text)]"
          title={opp?.username ?? 'Opponent'}
        >
          {opp?.username ?? 'Opponent'}
        </span>
        {isOpponentSpeaking && (
          <AudioWaveBar level={opponentSpeakingLevel} isLive={true} isOpponent={true} count={4} />
        )}
      </div>

      {/* Connection Quality Badge */}
      <div
        className={`voice-quality-badge ${qualityClass}`}
        title={qualityTooltip}
        aria-label={`Network connection quality is ${qualityLabel}. ${qualityTooltip}`}
        tabIndex={0}
      >
        <div className="voice-quality-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span>{qualityLabel}</span>
      </div>

      {/* Overflow Menu Anchor */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowMenu(s => !s)}
          className="voice-modal-close-btn p-1.5"
          aria-label="Voice options menu"
          aria-haspopup="true"
          aria-expanded={showMenu}
        >
          <IconMoreVertical size={16} />
        </button>

        {showMenu && (
          <div
            role="menu"
            aria-label="Voice Options"
            className="absolute right-0 top-full mt-2 w-56 bg-[var(--c-panel)] border border-[var(--c-border)] rounded-md shadow-lg p-2 text-xs z-50 flex flex-col gap-1"
          >
            {/* Output volume slider */}
            <div className="p-2 border-b border-[var(--c-border)]">
              <div className="flex items-center justify-between mb-1.5 font-mono text-[10px] text-[var(--c-text-mute)] uppercase">
                <span className="flex items-center gap-1.5">
                  <IconSpeaker size={12} />
                  <span>Volume</span>
                </span>
                <span>{Math.round(outputVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isOpponentMutedLocally ? 0 : outputVolume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--c-panel2)] rounded cursor-pointer accent-[var(--info)]"
                aria-label="Opponent output volume"
              />
            </div>

            {/* Mute Opponent */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleOpponentMute();
                setShowMenu(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--c-panel2)] text-[var(--c-text)] flex items-center gap-2"
            >
              <IconMicOff size={14} className="text-[var(--c-text-mute)]" />
              <span>{isOpponentMutedLocally ? VOICE_CONFIG.copy.unmuteOpponent : VOICE_CONFIG.copy.muteOpponent}</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenSettings();
                setShowMenu(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--c-panel2)] text-[var(--c-text)] flex items-center gap-2"
            >
              <IconSliders size={14} className="text-[var(--c-text-mute)]" />
              <span>{VOICE_CONFIG.copy.deviceSettings}</span>
            </button>

            {/* Report */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenReport();
                setShowMenu(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--c-panel2)] text-[var(--warn)] flex items-center gap-2"
            >
              <IconFlag size={14} />
              <span>{VOICE_CONFIG.copy.reportVoice}</span>
            </button>

            {/* Block */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenBlock();
                setShowMenu(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--c-panel2)] text-[var(--bad)] flex items-center gap-2"
            >
              <IconShield size={14} />
              <span>{VOICE_CONFIG.copy.blockPlayer}</span>
            </button>

            {/* End Call */}
            <div className="pt-1 mt-1 border-t border-[var(--c-border)]">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onEndVoice();
                  setShowMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-500/10 text-[var(--bad)] font-semibold flex items-center gap-2"
              >
                <IconPhoneOff size={14} />
                <span>{VOICE_CONFIG.copy.endVoice}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* End Call Direct Button */}
      <button
        type="button"
        onClick={onEndVoice}
        className="voice-topbar-btn is-bad px-2"
        title="End voice call"
        aria-label="End live voice call"
      >
        <IconPhoneOff size={13} />
        <span className="hidden sm:inline">End</span>
      </button>
    </div>
  );
}

