/**
 * src/pages/DevMascot.jsx
 *
 * Development-only preview route: /dev/mascot
 * Shows all expressions at 64px and 48px with live controls.
 * This route is NOT registered in production builds.
 */

import React, { useState } from 'react'
import MascotFace from '../components/mascot/MascotFace.jsx'
import '../components/mascot/mascot.css'
import '../styles/home-tokens.css'

const EXPRESSIONS = ['neutral', 'happy', 'thinking', 'alert', 'sleepy']

const panelStyle = {
  background: '#060d1c',
  border: '1px solid rgba(196,214,232,0.2)',
  borderRadius: '8px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
}

const labelStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  color: 'rgba(196,214,232,0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
}

export default function DevMascot() {
  const [blinking,  setBlinking]   = useState(false)
  const [lowPower,  setLowPower]   = useState(false)
  const [eyeX,      setEyeX]       = useState(0)
  const [eyeY,      setEyeY]       = useState(0)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#02060f',
      padding: '40px 24px',
      fontFamily: "'Sora Variable', 'Sora', system-ui, sans-serif",
    }}>
      <h1 style={{
        color: 'rgba(140,196,255,1)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        // DEV: Mascot Preview
      </h1>
      <p style={{ color: 'rgba(196,214,232,0.5)', fontSize: '13px', marginBottom: '32px' }}>
        All expressions at 64px and 48px. Modify controls below.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '40px', alignItems: 'center' }}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={blinking} onChange={e => setBlinking(e.target.checked)} />
          Blinking
        </label>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={lowPower} onChange={e => setLowPower(e.target.checked)} />
          Low Power
        </label>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Eye X:
          <input type="range" min="-3" max="3" step="0.5" value={eyeX}
            onChange={e => setEyeX(Number(e.target.value))} style={{ width: '80px' }} />
          {eyeX}
        </label>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Eye Y:
          <input type="range" min="-3" max="3" step="0.5" value={eyeY}
            onChange={e => setEyeY(Number(e.target.value))} style={{ width: '80px' }} />
          {eyeY}
        </label>
      </div>

      {/* 64px row */}
      <h2 style={{ ...labelStyle, marginBottom: '16px' }}>64px (Desktop)</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '48px' }}>
        {EXPRESSIONS.map(expr => (
          <div key={expr} style={panelStyle}>
            <MascotFace
              expression={expr}
              blinking={blinking}
              lowPower={lowPower}
              eyeOffsetX={eyeX}
              eyeOffsetY={eyeY}
              size={64}
            />
            <span style={labelStyle}>{expr}</span>
          </div>
        ))}
      </div>

      {/* 48px row */}
      <h2 style={{ ...labelStyle, marginBottom: '16px' }}>48px (Mobile)</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '48px' }}>
        {EXPRESSIONS.map(expr => (
          <div key={expr} style={panelStyle}>
            <MascotFace
              expression={expr}
              blinking={blinking}
              lowPower={lowPower}
              eyeOffsetX={eyeX}
              eyeOffsetY={eyeY}
              size={48}
            />
            <span style={labelStyle}>{expr}</span>
          </div>
        ))}
      </div>

      {/* Live widget demo */}
      <h2 style={{ ...labelStyle, marginBottom: '16px' }}>Live widget (bottom-right)</h2>
      <p style={{ color: 'rgba(196,214,232,0.5)', fontSize: '12px', marginBottom: '8px' }}>
        The real widget is mounted in the corner. Move your mouse to test eye tracking. Click to open the menu.
      </p>

      {/* Import here to test full widget in isolation */}
      <div style={{ height: '200px' }} />
    </div>
  )
}
