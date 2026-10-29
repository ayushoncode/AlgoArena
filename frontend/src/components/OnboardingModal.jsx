/**
 * src/components/OnboardingModal.jsx
 *
 * Consolidated Fighter Profile Onboarding Modal for Google Signups:
 *  - Requests both Coder Handle and College / University in a single unified card
 *  - Live debounced handle availability check
 *  - Autocomplete dropdown for college / university
 *  - Minimal dark tonal aesthetic consistent with AlgoArena
 *  - Zero emoji, zero Lucide icons, zero banned buzzwords
 */

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import { ArenaEmblem } from './ArenaLogo'
import { institutes } from '../utils/institutes'
import './OnboardingModal.css'

function InlineSpinner({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
      style={{ animation: 'onboarding-spin 0.8s linear infinite' }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="rgba(140, 196, 255, 0.2)" strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#8cc4ff" />
      <style>{`
        @keyframes onboarding-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  )
}

function CheckIcon({ size = 16, color = '#34d399' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="rgba(16, 185, 129, 0.15)" stroke={color} strokeWidth="1.25" />
      <path d="M5 8.2l2 2 4.2-4.4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon({ size = 16, color = '#f87171' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="rgba(239, 68, 68, 0.15)" stroke={color} strokeWidth="1.25" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon({ size = 13, color = '#ffd696' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function OnboardingModal() {
  const { user, refreshUser } = useAuth()

  // Determine what steps are still needed
  const needsUsername = Boolean(user && user.is_username_set === false)
  const needsInstitute = Boolean(user && !user.institute_locked)
  const shouldShow = Boolean(user && (needsUsername || needsInstitute))

  // Form states
  const [handle, setHandle] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState(null)
  const [availMsg, setAvailMsg] = useState('')

  const [institute, setInstitute] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState('')

  const hasInitializedRef = useRef(false)

  // Initialize handle and institute from user prop once
  useEffect(() => {
    if (!shouldShow || hasInitializedRef.current) return
    hasInitializedRef.current = true

    if (user?.username && needsUsername) {
      const clean = String(user.username).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
      setHandle(clean)
    }
    if (user?.institute) {
      setInstitute(user.institute)
    }
  }, [user, shouldShow, needsUsername])

  // Live debounced handle availability check
  useEffect(() => {
    if (!shouldShow || !needsUsername) return

    const clean = handle.trim().toLowerCase()
    if (!clean) {
      setAvailable(null)
      setAvailMsg('')
      setChecking(false)
      return
    }

    if (clean.length < 3) {
      setAvailable(false)
      setAvailMsg('Must be at least 3 characters')
      setChecking(false)
      return
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(clean)) {
      setAvailable(false)
      setAvailMsg('Letters, numbers, underscores only (3-30 chars)')
      setChecking(false)
      return
    }

    setChecking(true)
    setAvailable(null)
    setSubmitErr('')

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/users/check-username?username=${encodeURIComponent(clean)}`)
        setAvailable(data.available)
        setAvailMsg(data.available ? `@${clean} is available` : `@${clean} is already taken`)
      } catch {
        setAvailable(null)
        setAvailMsg('')
      } finally {
        setChecking(false)
      }
    }, 320)

    return () => clearTimeout(timer)
  }, [handle, shouldShow, needsUsername])

  // Filter college suggestions
  useEffect(() => {
    if (!needsInstitute) return
    const clean = institute.trim()
    if (clean.length > 0) {
      const filtered = institutes
        .filter((inst) => inst.toLowerCase().includes(clean.toLowerCase()))
        .slice(0, 5)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [institute, needsInstitute])

  if (!shouldShow) return null

  const isHandleValid = !needsUsername || (/^[a-zA-Z0-9_]{3,30}$/.test(handle.trim()) && available === true)
  const isInstituteValid = !needsInstitute || institute.trim().length >= 2
  const canSubmit = isHandleValid && isInstituteValid && !submitting && !checking

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setSubmitErr('')

    try {
      let latestUser = user
      let latestToken = localStorage.getItem('aa_token')

      // 1. Submit username if required
      if (needsUsername) {
        const cleanHandle = handle.trim().toLowerCase()
        const { data: uData } = await api.patch('/api/users/me/username', { username: cleanHandle })
        if (uData.user) latestUser = { ...latestUser, ...uData.user }
        if (uData.token) latestToken = uData.token
      }

      // 2. Submit institute if required
      if (needsInstitute) {
        const cleanInst = institute.trim()
        const { data: iData } = await api.patch('/api/users/me/institute', { institute: cleanInst })
        if (iData.user) latestUser = { ...latestUser, ...iData.user }
      }

      // 3. Persist and refresh auth state
      if (latestToken) localStorage.setItem('aa_token', latestToken)
      if (latestUser) localStorage.setItem('aa_user', JSON.stringify({ ...latestUser, token: latestToken }))
      await refreshUser(latestUser)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update fighter profile.'
      setSubmitErr(msg)
      if (err.response?.status === 409 && needsUsername) {
        setAvailable(false)
        setAvailMsg('This handle was just taken. Please choose another.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-card">
        {/* Header with Emblem */}
        <div className="onboarding-header">
          <div className="onboarding-emblem-wrap">
            <ArenaEmblem size={46} glow={true} animate={false} />
          </div>
          <span className="onboarding-kicker">Fighter Registration</span>
          <h2 id="onboarding-title" className="onboarding-title">
            Complete your profile.
          </h2>
          <p className="onboarding-subtitle">
            Set your permanent coder handle and college affiliation before entering the arena.
          </p>
        </div>

        {/* Error Alert */}
        {submitErr && (
          <div role="alert" className="onboarding-alert-error">
            <CrossIcon size={16} />
            <span>{submitErr}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="onboarding-form" noValidate>
          {/* FIELD 1: Coder Handle */}
          {needsUsername && (
            <div className="onboarding-field">
              <div className="onboarding-label-row">
                <label htmlFor="onboarding-handle" className="onboarding-label">
                  Coder Handle
                </label>
              </div>

              <div className="onboarding-input-wrap">
                <span className="onboarding-input-prefix">@</span>
                <input
                  id="onboarding-handle"
                  type="text"
                  autoFocus
                  required
                  maxLength={30}
                  placeholder="e.g. byte_master"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className={`onboarding-input has-prefix has-status-icon ${
                    available === true ? 'is-valid' : available === false ? 'is-invalid' : ''
                  }`}
                  spellCheck={false}
                  autoComplete="off"
                />

                <div className="onboarding-status-icon" aria-hidden="true">
                  {checking ? (
                    <InlineSpinner size={16} />
                  ) : available === true ? (
                    <CheckIcon size={16} />
                  ) : available === false ? (
                    <CrossIcon size={16} />
                  ) : null}
                </div>
              </div>

              <div className="onboarding-helper-row">
                {checking ? (
                  <span className="onboarding-helper-text is-checking">Checking availability...</span>
                ) : availMsg ? (
                  <span className={`onboarding-helper-text ${available ? 'is-valid' : 'is-invalid'}`}>
                    {availMsg}
                  </span>
                ) : (
                  <span className="onboarding-helper-text">
                    3 to 30 characters (letters, numbers, underscore)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* FIELD 2: College / University */}
          {needsInstitute && (
            <div className="onboarding-field">
              <div className="onboarding-label-row">
                <label htmlFor="onboarding-institute" className="onboarding-label">
                  College or University
                </label>
              </div>

              <div className="onboarding-input-wrap">
                <input
                  id="onboarding-institute"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. IIT Delhi, BITS Pilani, Stanford..."
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="onboarding-input"
                  spellCheck={false}
                  autoComplete="off"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="onboarding-suggestions" role="listbox">
                    {suggestions.map((item, idx) => (
                      <li
                        key={idx}
                        role="option"
                        aria-selected={institute === item}
                        className="onboarding-suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setInstitute(item)
                          setShowSuggestions(false)
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <span className="onboarding-helper-text">
                Start typing to see suggestions or type your custom institution name
              </span>
            </div>
          )}

          {/* Permanent Lock Notice Box */}
          <div className="onboarding-lock-notice">
            <div className="onboarding-lock-icon">
              <LockIcon size={13} />
            </div>
            <p className="onboarding-lock-text">
              Credentials notice: For tournament ranking integrity, your handle and college cannot be changed once saved.
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="onboarding-submit-btn"
          >
            <span>
              {submitting
                ? 'Setting Up Fighter Profile...'
                : 'Complete Profile & Enter Arena'}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}

