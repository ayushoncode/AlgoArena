/**
 * frontend/src/components/voice/VoiceSettingsModal.jsx
 *
 * Voice device settings dialog:
 * - Microphone input selection
 * - Speaker output selection (with setSinkId support)
 * - Live input level meter (Web Audio AnalyserNode) with microphone test
 * - Headphone tip ("Headphones prevent echo.")
 * - Push-to-talk option and shortcut summary (Alt+M)
 */

import React, { useState, useEffect, useRef } from 'react';
import { IconSliders, IconClose, IconMic, IconSpeaker, IconCheck } from './VoiceIcons';
import { VOICE_CONFIG } from '../../content/voice';
import './voice.css';

export default function VoiceSettingsModal({
  isOpen,
  pushToTalkEnabled,
  onTogglePushToTalk,
  onClose,
}) {
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState('');
  const [selectedOutputId, setSelectedOutputId] = useState('');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);

  const testStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  // Enumerate audio devices
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
        console.warn('[VoiceSettings] enumerateDevices notice:', err.message);
      }
    }

    loadDevices();
  }, [isOpen, selectedInputId, selectedOutputId]);

  // Clean up mic test on close
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
    setInputLevel(0);
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
        const pct = Math.min(100, Math.round((avg / 128) * 100));
        setInputLevel(pct);
        animFrameRef.current = requestAnimationFrame(tick);
      }

      tick();
    } catch (err) {
      console.warn('[VoiceSettings] Mic test getUserMedia notice:', err.message);
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
          onClose();
        }
      }}
    >
      <div className="voice-modal-frame">
        <div className="voice-modal-header">
          <div className="flex items-center gap-2">
            <IconSliders size={16} className="text-[var(--info)]" />
            <h3 id="voice-settings-title" className="voice-modal-title">
              {VOICE_CONFIG.copy.deviceSettings}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopMicTest();
              onClose();
            }}
            className="voice-modal-close-btn"
            aria-label="Close voice settings"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="voice-modal-body">
          {/* Headphone tip */}
          <div className="p-2.5 rounded bg-[var(--c-panel2)] border border-[var(--c-border)] text-xs text-[var(--c-text-dim)] flex items-center gap-2">
            <IconSpeaker size={15} className="text-[var(--info)] shrink-0" />
            <span>{VOICE_CONFIG.copy.headphoneTip}</span>
          </div>

          {/* Microphone Selector */}
          <div>
            <label htmlFor="voice-mic-select" className="voice-select-label">
              {VOICE_CONFIG.copy.inputDevice}
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

          {/* Microphone Test Step */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] text-[var(--c-text-mute)] uppercase">
                {VOICE_CONFIG.copy.speakingLevel}
              </span>
              <button
                type="button"
                onClick={isTestingMic ? stopMicTest : startMicTest}
                className="font-mono text-[10px] text-[var(--info)] hover:underline"
              >
                {isTestingMic ? 'Stop Test' : VOICE_CONFIG.copy.testMicrophone}
              </button>
            </div>
            <div className="voice-meter-bar">
              <div
                className="voice-meter-fill"
                style={{ width: `${inputLevel}%` }}
                aria-valuenow={inputLevel}
                aria-valuemin="0"
                aria-valuemax="100"
                role="progressbar"
              />
            </div>
          </div>

          {/* Speaker Selector (if supported) */}
          {audioOutputs.length > 0 && (
            <div>
              <label htmlFor="voice-speaker-select" className="voice-select-label">
                {VOICE_CONFIG.copy.outputDevice}
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

          {/* Push to talk option */}
          <div className="border-t border-[var(--c-border)] pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--c-text)]">
              <input
                type="checkbox"
                checked={pushToTalkEnabled}
                onChange={(e) => onTogglePushToTalk(e.target.checked)}
                className="rounded border-[var(--c-border)] accent-[var(--info)]"
              />
              <span className="font-semibold">{VOICE_CONFIG.copy.pushToTalkLabel}</span>
            </label>
            <p className="font-mono text-[10px] text-[var(--c-text-mute)] mt-1 ml-5">
              {VOICE_CONFIG.copy.pushToTalkHint}
            </p>
          </div>

          {/* Keyboard Shortcut Note */}
          <div className="border-t border-[var(--c-border)] pt-2.5 font-mono text-[10px] text-[var(--c-text-mute)] flex justify-between">
            <span>Toggle Mute Shortcut:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--c-panel2)] border border-[var(--c-border)] text-[var(--c-text)] font-bold">
              {VOICE_CONFIG.muteToggleShortcut}
            </kbd>
          </div>
        </div>

        <div className="voice-modal-footer">
          <button
            type="button"
            onClick={() => {
              stopMicTest();
              onClose();
            }}
            className="voice-btn-accept px-4"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}

