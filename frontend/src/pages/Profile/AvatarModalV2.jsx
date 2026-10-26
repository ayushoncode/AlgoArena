import React, { useState } from 'react'
import { UserAvatar } from '../../utils/avatar'
import { IconClose, IconShuffle } from '../../components/icons'

export default function AvatarModalV2({
  isOpen,
  onClose,
  currentSeed,
  currentStyle,
  username,
  onSave,
}) {
  const [selectedStyle, setSelectedStyle] = useState(currentStyle || 'adventurer')
  const [selectedSeed, setSelectedSeed] = useState(currentSeed || username || 'coder')
  const [customInput, setCustomInput] = useState('')
  const [saving, setSaving] = useState(false)

  const styles = [
    { id: 'adventurer', label: 'Adventurer' },
    { id: 'lorelei', label: 'Lorelei' },
    { id: 'bottts', label: 'Cyber Bot' },
    { id: 'pixel-art', label: 'Pixel Gamer' },
    { id: 'notionists', label: 'Tech Sketch' },
  ]

  const PRESETS = {
    adventurer: ['Felix', 'Leo', 'Max', 'Alex', 'Oliver', 'Liam', 'Ethan', 'Aiden'],
    lorelei: ['Sara', 'Maya', 'Luna', 'Chloe', 'Zoe', 'Lily', 'Emma', 'Aria'],
    bottts: ['Glitch', 'Cyber', 'Neon', 'Pixel', 'Matrix', 'Vortex', 'Spark', 'Nova'],
    'pixel-art': ['Shadow', 'Blaze', 'Cipher', 'Titan', 'Ghost', 'Phantom', 'Knight', 'Rogue'],
    notionists: ['Code', 'Zen', 'Echo', 'Orbit', 'Pulse', 'Byte', 'Apex', 'Prism'],
  }

  const handleRandom = () => {
    const pool = PRESETS[selectedStyle] || PRESETS.adventurer
    const rand = pool[Math.floor(Math.random() * pool.length)] + Math.floor(Math.random() * 1000)
    setSelectedSeed(rand)
  }

  const handleApplyCustom = (e) => {
    e?.preventDefault()
    if (customInput.trim()) {
      setSelectedSeed(customInput.trim())
      setCustomInput('')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ avatar_seed: selectedSeed, avatar_style: selectedStyle })
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="profile-v2-modal-overlay">
      <div className="profile-v2-modal-panel">
        {/* Header */}
        <div className="profile-v2-modal-header">
          <h3 className="profile-v2-modal-title">
            Customize avatar
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="profile-v2-modal-close"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Preview Frame */}
        <div className="profile-v2-preview-box">
          <div className="profile-avatar-frame" style={{ width: 68, height: 68 }}>
            <UserAvatar
              username={username}
              seed={selectedSeed}
              style={selectedStyle}
              size={68}
              isMe={true}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>@{username}</span>
            <span style={{ color: 'var(--sub)' }}>Style: {selectedStyle}</span>
            <span style={{ color: 'var(--sub)', fontSize: 11, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Seed: {selectedSeed}
            </span>
          </div>
        </div>

        {/* Style Selection Tabs */}
        <div className="profile-v2-style-tabs">
          {styles.map(st => {
            const active = selectedStyle === st.id
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedStyle(st.id)
                  setSelectedSeed(PRESETS[st.id]?.[0] || 'seed1')
                }}
                className={`profile-v2-style-tab ${active ? 'active' : ''}`}
              >
                {st.label}
              </button>
            )
          })}
        </div>

        {/* Presets Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub)' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Curated presets</span>
            <button
              type="button"
              onClick={handleRandom}
              style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}
            >
              <IconShuffle size={13} />
              <span>Randomize</span>
            </button>
          </div>

          <div className="profile-v2-preset-grid">
            {(PRESETS[selectedStyle] || []).map((preset) => {
              const active = selectedSeed === preset
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedSeed(preset)}
                  className={`profile-v2-preset-btn ${active ? 'active' : ''}`}
                >
                  <UserAvatar username={username} seed={preset} style={selectedStyle} size={32} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Input */}
        <form onSubmit={handleApplyCustom} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            placeholder="Type custom seed name..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            className="handle-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-action">
            Apply
          </button>
        </form>

        {/* Footer Actions */}
        <div className="profile-v2-modal-footer">
          <button type="button" onClick={onClose} className="btn-action">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="btn-action"
            style={{ background: 'var(--ink)', color: 'var(--bg-0)', borderColor: 'var(--ink)', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  )
}
