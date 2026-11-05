/**
 * frontend/src/components/voice/VoiceSettingsModal.jsx
 *
 * Device settings dialog for Live Voice:
 * - Input device select
 * - Output device select (if supported by browser)
 * - Input level meter: three neutral bars, no green gradient
 * - Push-to-talk toggle and Alt+M keyboard shortcut reference
 * - 480px max width on desktop, full-width bottom sheet on phone, 6px radius
 */

import React, { useState, useEffect, useRef } from 'react';
import { IconSliders, IconClose, IconSpeaker } from './VoiceIcons';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceSettingsModal({
  isOpen,
  pushToTalk,
  pushToTalkEnabled,
  onTogglePushToTalk,
  onClose,
}) {
  const isPtt = pushToTalk ?? pushToTalkEnabled ?? false;
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState('');
  const [selectedOutputId, setSelectedOutputId] = useState('');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [activeBars, setActiveBars] = useState(0); // 0, 1, 2, or 3 bars

  const testStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  // Enumerate devices
  useEffect(() => {
    if (!isOpen) return;

    async function loadDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d => d.kind === 'audioinput');
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioInputs(inputs);
        setAudioOutputs(outputs);
        if (inputs.length && !selectedInputId) setSelectedInputId(inputs[0].deviceId);
        if (outputs.length && !selectedOutputId) setSelectedOutputId(outputs[0].deviceId);
      } catch (err) {
        console.warn('[VoiceSettings] Device enumeration note:', err.message);
      }
    }

    loadDevices();
  }, [isOpen, selectedInputId, selectedOutputId]);

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      stopMicTest();
    }
  }, [isOpen]);

  function stopMicTest() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(t => t.stop());
      testStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsTestingMic(false);
    setActiveBars(0);
  }

  async function startMicTest() {
    stopMicTest();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedInputId ? { deviceId: { exact: selectedInputId } } : true,
      });
      testStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      setIsTestingMic(true);

      function tick() {
        if (!analyser) return;
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        if (avg > 50) {
          setActiveBars(3);
        } else if (avg > 20) {
          setActiveBars(2);
        } else if (avg > 5) {
          setActiveBars(1);
        } else {
          setActiveBars(0);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      }

      tick();
    } catch (err) {
      console.warn('[VoiceSettings] Mic test getUserMedia note:', err.message);
      setIsTestingMic(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-settings-title"
      className="voice-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopMicTest();
          onClose?.();
        }
      }}
    >
      <div className="voice-modal-frame">
        {/* Header */}
        <div className="voice-modal-header">
          <div className="flex items-center gap-2">
            <IconSliders size={16} className="text-[var(--info)]" />
            <h3 id="voice-settings-title" className="voice-modal-title">
              Voice settings
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopMicTest();
              onClose?.();
            }}
            className="voice-modal-close-btn"
            aria-label="Close voice settings"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="voice-modal-body space-y-4">
          {/* Headphone tip */}
          <div className="p-3 rounded-md bg-[var(--bg-surface)] border border-[var(--hairline)] text-xs text-[var(--ink-muted)] flex items-center gap-2.5">
            <IconSpeaker size={16} className="text-[var(--info)] shrink-0" />
            <span>Headphones prevent echo and feedback during matches.</span>
          </div>

          {/* Input device select */}
          <div>
            <label htmlFor="voice-mic-select" className="voice-select-label">
              Microphone
            </label>
            <select
              id="voice-mic-select"
              value={selectedInputId}
              onChange={(e) => {
                setSelectedInputId(e.target.value);
                if (isTestingMic) startMicTest();
              }}
              className="voice-select"
            >
              {audioInputs.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId}>
                  {d.label || `Microphone ${idx + 1}`}
                </option>
              ))}
              {audioInputs.length === 0 && <option value="">Default Microphone</option>}
            </select>
          </div>

          {/* Input level meter: three neutral bars, no green gradient */}
          <div className="p-3 rounded-md bg-[var(--bg-surface)] border border-[var(--hairline)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                Input level
              </span>
              <button
                type="button"
                onClick={isTestingMic ? stopMicTest : startMicTest}
                className="font-mono text-xs text-[var(--info)] hover:underline"
              >
                {isTestingMic ? 'Stop test' : 'Test mic'}
              </button>
            </div>
            {/* Three neutral bars */}
            <div className="voice-level-meter-three" aria-label={`Input level is ${activeBars} of 3`}>
              <span className={`voice-level-bar ${activeBars >= 1 ? 'is-active' : ''}`} />
              <span className={`voice-level-bar ${activeBars >= 2 ? 'is-active' : ''}`} />
              <span className={`voice-level-bar ${activeBars >= 3 ? 'is-active' : ''}`} />
            </div>
          </div>

          {/* Output device select (if supported) */}
          {audioOutputs.length > 0 && (
            <div>
              <label htmlFor="voice-speaker-select" className="voice-select-label">
                Audio output
              </label>
              <select
                id="voice-speaker-select"
                value={selectedOutputId}
                onChange={(e) => setSelectedOutputId(e.target.value)}
                className="voice-select"
              >
                {audioOutputs.map((d, idx) => (
                  <option key={d.deviceId || idx} value={d.deviceId}>
                    {d.label || `Speaker ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Push-to-talk option */}
          <div className="border-t border-[var(--hairline)] pt-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[var(--ink)]">
              <input
                type="checkbox"
                checked={isPtt}
                onChange={(e) => onTogglePushToTalk?.(e.target.checked)}
                className="rounded border-[var(--hairline)] accent-[var(--info)]"
              />
              <span className="font-semibold">Push to talk</span>
            </label>
            <p className="font-mono text-[11px] text-[var(--ink-muted)] mt-1 ml-6">
              Hold the mute key to transmit audio.
            </p>
          </div>

          {/* Keyboard shortcut */}
          <div className="border-t border-[var(--hairline)] pt-3 font-mono text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
            <span>Toggle mute shortcut:</span>
            <kbd className="px-2 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--hairline)] text-[var(--ink)] font-bold">
              Alt + M
            </kbd>
          </div>
        </div>

        {/* Footer */}
        <div className="voice-modal-footer">
          <button
            type="button"
            onClick={() => {
              stopMicTest();
              onClose?.();
            }}
            className="voice-btn-primary h-11 px-6"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
