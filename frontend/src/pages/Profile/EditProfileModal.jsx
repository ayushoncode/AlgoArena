import React, { useState, useEffect } from 'react'
import { UserAvatar } from '../../utils/avatar'

export default function EditProfileModal({
  isOpen,
  onClose,
  activeUser,
  onSaveProfile,
  onOpenAvatarModal,
}) {
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [institute, setInstitute] = useState('')
  const [website, setWebsite] = useState('')
  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeUser) {
      setDisplayName(activeUser.display_name || activeUser.name || '')
      setBio(activeUser.bio || '')
      setLocation(activeUser.location || '')
      setInstitute(activeUser.institute || '')
      setWebsite(activeUser.website || '')
      setGithub(activeUser.github || '')
      setLinkedin(activeUser.linkedin || '')
    }
  }, [activeUser, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSaveProfile({
        display_name: displayName,
        bio,
        location,
        institute,
        website,
        github,
        linkedin,
      })
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(2, 6, 15, 0.92)' }}
    >
      <div className="edit-profile-modal-card">
        {/* Modal Header */}
        <div className="edit-profile-modal-header">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h2 className="edit-profile-modal-title">Edit Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-modal-close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="edit-profile-modal-body">
          {/* Avatar Section */}
          <div className="edit-profile-avatar-row">
            <UserAvatar
              username={activeUser?.username || 'Warrior'}
              seed={activeUser?.avatar_seed}
              style={activeUser?.avatar_style}
              elo={activeUser?.elo_rating}
              size={60}
              isMe={true}
            />
            <div className="avatar-action-column">
              <span className="avatar-section-label">Profile Avatar</span>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenAvatarModal()
                }}
                className="btn-change-avatar-action"
                title="Change Avatar"
                aria-label="Change Avatar"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <span>Change avatar</span>
              </button>
            </div>
          </div>

          {error && <p className="edit-profile-error">{error}</p>}

          <div className="edit-profile-fields-grid">
            {/* Display Name */}
            <div className="edit-field-group">
              <label>Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Ayush Singh"
                maxLength={60}
              />
              <span className="field-hint">Your public display name.</span>
            </div>

            {/* AlgoArena ID (Fixed / Read-only) */}
            <div className="edit-field-group">
              <label>AlgoArena ID</label>
              <input
                type="text"
                value={`@${activeUser?.username || ''}`}
                disabled
                className="input-disabled"
              />
              <span className="field-hint">AlgoArena ID is permanent and cannot be changed.</span>
            </div>

            {/* Location */}
            <div className="edit-field-group">
              <label>Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. India"
                maxLength={50}
              />
            </div>

            {/* College / Institute */}
            <div className="edit-field-group">
              <label>College / Institute</label>
              <input
                type="text"
                value={institute}
                disabled={Boolean(activeUser?.institute || activeUser?.institute_locked)}
                readOnly={Boolean(activeUser?.institute || activeUser?.institute_locked)}
                onChange={e => setInstitute(e.target.value)}
                placeholder="e.g. Ramaiah Institute of Technology"
                maxLength={100}
                className={activeUser?.institute || activeUser?.institute_locked ? 'input-disabled' : ''}
              />
              <span className="field-hint">
                {activeUser?.institute || activeUser?.institute_locked
                  ? 'College / Institute is permanent and cannot be changed.'
                  : 'Your academic affiliation.'}
              </span>
            </div>

            {/* Website */}
            <div className="edit-field-group span-2">
              <label>Website / Portfolio URL</label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://..."
                maxLength={255}
              />
            </div>

            {/* GitHub */}
            <div className="edit-field-group">
              <label>GitHub</label>
              <input
                type="text"
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="username or link"
                maxLength={100}
              />
            </div>

            {/* LinkedIn */}
            <div className="edit-field-group">
              <label>LinkedIn</label>
              <input
                type="text"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                placeholder="username or link"
                maxLength={100}
              />
            </div>

            {/* Bio */}
            <div className="edit-field-group span-2">
              <label>Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell the arena about yourself..."
                maxLength={250}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="edit-profile-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-modal-save"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
