/**
 * frontend/src/components/voice/AudioWaveBar.jsx
 *
 * Interactive real-time audio equalizer bars:
 * - 5 harmonic frequency bars reacting dynamically to speech energy (0.0 to 1.0)
 * - Ambient idle breathing wave when live but silent
 * - Clean semantic colors (emerald for local mic, cyan for opponent)
 * - Zero gradients, zero glow, full light theme support
 */

import React from 'react';
import './voice.css';

export default function AudioWaveBar({
  level = 0,
  isLive = true,
  isOpponent = false,
  count = 5,
}) {
  if (!isLive) return null;

  // Harmonic distribution across frequency bands
  const multipliers = count === 3 ? [0.6, 1.0, 0.6] : [0.45, 0.75, 1.0, 0.75, 0.45];
  const isSilent = level < 0.05;

  return (
    <div
      className={`voice-audio-bars ${isOpponent ? 'is-opponent' : ''} ${isSilent ? 'is-idle' : 'is-active'}`}
      aria-hidden="true"
    >
      {multipliers.map((mult, i) => {
        const scale = isSilent
          ? 0.25
          : Math.max(0.2, Math.min(1.0, 0.2 + level * mult * 1.2));

        return (
          <span
            key={i}
            style={{
              transform: `scaleY(${scale})`,
              animationDelay: isSilent ? `${i * 0.12}s` : '0s',
            }}
          />
        );
      })}
    </div>
  );
}
