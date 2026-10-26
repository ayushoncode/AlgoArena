import React, { useState, useEffect } from 'react'
import { IconClose, IconCopy, IconCheck, IconSwords } from '../../components/icons'
import './Lobby.css'

export default function PrivateMatchModalV2({
  isOpen,
  onClose,
  topic,
  diff,
  emit,
  on,
  off,
  initialRoomCode,
  initialTab = 'create',
}) {
  const [tab, setTab] = useState(initialRoomCode ? 'join' : (initialTab || 'create'))
  const [roomCode, setRoomCode] = useState(initialRoomCode || '')
  const [createdRoom, setCreatedRoom] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (initialRoomCode) {
      setTab('join')
      setRoomCode(initialRoomCode)
    }
  }, [initialRoomCode])

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    function onCreated(data) {
      setCreatedRoom(data)
      setErrorMsg(null)
    }
    function onError(err) {
      setErrorMsg(err.message)
    }
    function onCancelled() {
      setCreatedRoom(null)
      setErrorMsg(null)
    }

    on('custom_room_created', onCreated)
    on('custom_room_error', onError)
    on('custom_room_cancelled', onCancelled)

    return () => {
      off('custom_room_created', onCreated)
      off('custom_room_error', onError)
      off('custom_room_cancelled', onCancelled)
    }
  }, [on, off])

  // Escape key closes modal & cancels room if open
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        handleCancelCreated()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, createdRoom, onClose])

  function handleCreateRoom() {
    if (!topic) {
      setErrorMsg('Select a topic first')
      return
    }
    setErrorMsg(null)
    emit('create_custom_room', { topic, difficulty: diff })
  }

  function handleCancelCreated() {
    if (createdRoom) {
      emit('cancel_custom_room', { code: createdRoom.code })
      setCreatedRoom(null)
    }
  }

  function handleJoinRoom() {
    if (!roomCode.trim()) {
      setErrorMsg('Enter a room code')
      return
    }
    setErrorMsg(null)
    emit('join_custom_room', { code: roomCode.trim() })
  }

  function handleCopyLink() {
    if (!createdRoom) return
    navigator.clipboard.writeText(`${window.location.origin}/lobby?room=${createdRoom.code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  const TABS = [
    { id: 'create', label: 'Create Room' },
    { id: 'join', label: 'Join Code' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Private Duel modal"
      className="lobby-v2-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancelCreated()
          onClose()
        }
      }}
    >
      <div className="lobby-v2-modal-frame">
        {/* Modal Header */}
        <div className="lobby-v2-modal-header">
          <div>
            <span className="lobby-v2-modal-overline">Private Match</span>
            <h3 className="lobby-v2-modal-title">Play with a friend</h3>
          </div>
          <button
            type="button"
            className="lobby-v2-modal-close"
            onClick={() => {
              handleCancelCreated()
              onClose()
            }}
            aria-label="Close dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Tab Segment */}
        <div className="lobby-v2-modal-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                setErrorMsg(null)
              }}
              className={`lobby-v2-modal-tab ${tab === t.id ? 'is-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div role="alert" className="lobby-v2-modal-error">
            {errorMsg}
          </div>
        )}

        {/* Tab Content: Create Room */}
        {tab === 'create' && (
          <div className="lobby-v2-modal-body">
            {!createdRoom ? (
              <>
                <div className="lobby-v2-modal-summary">
                  <div className="lobby-v2-modal-row">
                    <span>Selected Topic:</span>
                    <strong>{topic || 'Select a topic first'}</strong>
                  </div>
                  <div className="lobby-v2-modal-row">
                    <span>Difficulty:</span>
                    <strong>{diff}</strong>
                  </div>
                  <div className="lobby-v2-modal-row">
                    <span>Match Type:</span>
                    <strong style={{ color: 'var(--sub, #a2a9b8)' }}>Casual Duel (Unranked)</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={!topic}
                  className="lobby-v2-btn-primary w-full"
                >
                  <IconSwords size={14} />
                  <span>Generate Room Code</span>
                </button>
              </>
            ) : (
              <div className="lobby-v2-created-room-block">
                <p className="lobby-v2-modal-note">
                  Share this code or link with your opponent:
                </p>

                <div className="lobby-v2-roomcode-display">
                  <span className="lobby-v2-roomcode-text">{createdRoom.code}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="lobby-v2-copy-btn"
                  >
                    {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <span aria-live="polite" className="sr-only">
                    {copied ? 'Room link copied to clipboard' : ''}
                  </span>
                </div>

                <div className="lobby-v2-room-status">
                  <span className="lobby-v2-status-dot is-pulsing" />
                  <span>Waiting for opponent to join...</span>
                </div>

                <button
                  type="button"
                  onClick={handleCancelCreated}
                  className="lobby-v2-modal-cancel-text"
                >
                  Cancel Room
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Join Code */}
        {tab === 'join' && (
          <div className="lobby-v2-modal-body">
            <div className="lobby-v2-input-group">
              <label htmlFor="room-code-input" className="lobby-v2-input-label">
                Invite Code
              </label>
              <input
                id="room-code-input"
                type="text"
                placeholder="e.g. ARENA-8K2Y"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="lobby-v2-code-input"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <button
              type="button"
              onClick={handleJoinRoom}
              className="lobby-v2-btn-primary w-full"
            >
              <IconSwords size={14} />
              <span>Enter Room</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
