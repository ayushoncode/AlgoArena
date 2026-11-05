/**
 * frontend/src/components/voice/VoiceDock.jsx
 *
 * Connected voice dock component:
 * - 44px minimum tap targets
 * - Mic on uses --info outline; Mic off uses ink on hairline (never green for connected)
 * - Network quality telemetry badge (3 bars + Good/Fair/Poor + tooltip)
 * - Keyboard accessible overflow menu with Arrow keys, Esc dismiss, and focus return
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
import './voice.css';

export default function VoiceDock({
  opp,
  isMicMuted = true,
  isOpponentSpeaking = false,
  speakingLevel = 0,
  opponentSpeakingLevel = 0,
  quality,
  outputVolume = 1,
  isOpponentMutedLocally = false,
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
  const moreBtnRef = useRef(null);
  const menuItemsRef = useRef([]);

  useEffect(() => {
    if (!showMenu) return;

    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMenu(false);
        moreBtnRef.current?.focus();
        return;
      }

      const items = menuItemsRef.current.filter(Boolean);
      if (items.length === 0) return;
      const currentIndex = items.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
      }
    }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    setTimeout(() => {
      menuItemsRef.current[0]?.focus();
    }, 40);

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
      {/* 40-44px Mic Mute Button (Never green: --info for live, ink on hairline for muted) */}
      <button
        type="button"
        onClick={onToggleMute}
        className={`voice-dock__mute-btn ${!isMicMuted ? 'is-live' : 'is-muted'}`}
        aria-label={isMicMuted ? 'Microphone is muted. Click or press Alt+M to speak' : 'Microphone is live. Click or press Alt+M to mute'}
        aria-pressed={!isMicMuted}
        title="Toggle Microphone (Alt+M)"
      >
        {!isMicMuted ? <IconMic size={16} /> : <IconMicOff size={16} />}
        <span>{!isMicMuted ? 'Mic on' : 'Mic off'}</span>
        {!isMicMuted && (
          <AudioWaveBar level={speakingLevel} isLive={true} isOpponent={false} count={4} />
        )}
      </button>

      {/* Opponent Avatar & Speaking Ring */}
      <div className="flex items-center gap-2 pl-1 pr-2 border-r border-[var(--hairline)]">
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
          className="font-mono text-xs font-semibold truncate max-w-[80px] text-[var(--ink)]"
          title={opp?.username ?? 'Opponent'}
        >
          {opp?.username ?? 'Opponent'}
        </span>
        {isOpponentSpeaking && (
          <AudioWaveBar level={opponentSpeakingLevel} isLive={true} isOpponent={true} count={3} />
        )}
      </div>

      {/* Connection Quality Telemetry Indicator */}
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
          ref={moreBtnRef}
          onClick={() => setShowMenu(s => !s)}
          className="voice-row__overflow-btn voice-dock__more-btn"
          aria-label="Voice settings and actions"
          aria-haspopup="true"
          aria-expanded={showMenu}
        >
          <IconMoreVertical size={16} />
        </button>

        {showMenu && (
          <div
            role="menu"
            aria-label="Voice Options"
            className="voice-overflow-menu"
          >
            {/* Output volume slider */}
            <div className="p-2 border-b border-[var(--hairline)]">
              <div className="flex items-center justify-between mb-1.5 font-mono text-[10px] text-[var(--ink-muted)] uppercase">
                <span className="flex items-center gap-1.5">
                  <IconSpeaker size={12} />
                  <span>Output Volume</span>
                </span>
                <span className="tabular-nums">{Math.round(outputVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isOpponentMutedLocally ? 0 : outputVolume}
                onChange={(e) => onChangeVolume?.(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--bg-surface)] rounded cursor-pointer accent-[var(--info)]"
                aria-label="Opponent output volume"
              />
            </div>

            {/* Mute Opponent */}
            <button
              type="button"
              role="menuitem"
              ref={el => (menuItemsRef.current[0] = el)}
              onClick={() => {
                onToggleOpponentMute?.();
                setShowMenu(false);
              }}
              className="voice-overflow-item voice-dock__menu-item"
            >
              <IconMicOff size={14} className="text-[var(--ink-muted)] shrink-0" />
              <span>{isOpponentMutedLocally ? 'Unmute opponent' : 'Mute opponent'}</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              role="menuitem"
              ref={el => (menuItemsRef.current[1] = el)}
              onClick={() => {
                onOpenSettings?.();
                setShowMenu(false);
              }}
              className="voice-overflow-item voice-dock__menu-item"
            >
              <IconSliders size={14} className="text-[var(--ink-muted)] shrink-0" />
              <span>Settings</span>
            </button>

            {/* Report */}
            <button
              type="button"
              role="menuitem"
              ref={el => (menuItemsRef.current[2] = el)}
              onClick={() => {
                onOpenReport?.();
                setShowMenu(false);
              }}
              className="voice-overflow-item voice-dock__menu-item text-[var(--warn)]"
            >
              <IconFlag size={14} className="shrink-0" />
              <span>Report voice</span>
            </button>

            {/* Block */}
            <button
              type="button"
              role="menuitem"
              ref={el => (menuItemsRef.current[3] = el)}
              onClick={() => {
                onOpenBlock?.();
                setShowMenu(false);
              }}
              className="voice-overflow-item voice-dock__menu-item text-[var(--bad)]"
            >
              <IconShield size={14} className="shrink-0" />
              <span>Block voice from this player</span>
            </button>

            {/* End Call */}
            <div className="pt-1 mt-1 border-t border-[var(--hairline)]">
              <button
                type="button"
                role="menuitem"
                ref={el => (menuItemsRef.current[4] = el)}
                onClick={() => {
                  onEndVoice?.();
                  setShowMenu(false);
                }}
                className="voice-overflow-item voice-dock__menu-item voice-dock__menu-item--danger text-[var(--bad)] font-semibold"
              >
                <IconPhoneOff size={14} className="shrink-0" />
                <span>End voice</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* End Call Direct Button */}
      <button
        type="button"
        onClick={onEndVoice}
        className="voice-topbar-btn is-bad px-2.5"
        title="End voice call"
        aria-label="End live voice call"
      >
        <IconPhoneOff size={13} />
        <span className="hidden sm:inline">End</span>
      </button>
    </div>
  );
}
