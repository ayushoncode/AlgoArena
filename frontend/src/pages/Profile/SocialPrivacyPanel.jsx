import React, { useState, useEffect } from 'react';
import { getSocialSettings, updateSocialSettings } from '../../services/socialApi';
import { SOCIAL_CONFIG } from '../../content/social';
import './SocialPrivacyPanel.css';

/**
 * frontend/src/pages/Profile/SocialPrivacyPanel.jsx
 *
 * Privacy and notifications control page:
 * - Who can send friend requests (everyone, nobody)
 * - Who can see friends list (signed_in, friends_only, only_me)
 * - Notification muting by type
 */
export default function SocialPrivacyPanel() {
  const [allowRequests, setAllowRequests] = useState('everyone');
  const [friendsVisibility, setFriendsVisibility] = useState('signed_in');
  const [mutedTypes, setMutedTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    getSocialSettings()
      .then(data => {
        if (!active) return;
        if (data.allow_requests) setAllowRequests(data.allow_requests);
        if (data.friends_visibility) setFriendsVisibility(data.friends_visibility);
        if (Array.isArray(data.muted_types)) setMutedTypes(data.muted_types);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleMute = (typeId) => {
    setMutedTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(t => t !== typeId);
      }
      return [...prev, typeId];
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await updateSocialSettings({
        allow_requests: allowRequests,
        friends_visibility: friendsVisibility,
        muted_types: mutedTypes
      });
      setFeedback('Settings updated successfully.');
      setTimeout(() => setFeedback(''), 4000);
    } catch {
      setFeedback('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="social-privacy-container">
        <div className="notif-skeleton-row" style={{ height: '80px', marginBottom: '20px' }} />
        <div className="notif-skeleton-row" style={{ height: '140px', marginBottom: '20px' }} />
        <div className="notif-skeleton-row" style={{ height: '140px' }} />
      </div>
    );
  }

  return (
    <div className="social-privacy-container">
      <div className="privacy-header">
        <h1 className="privacy-title">Social & Privacy Settings</h1>
        <p className="privacy-subtitle">
          Control your connection visibility and incoming notifications.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* 1. Request Permissions */}
        <div className="privacy-section-card">
          <h2 className="privacy-section-title">Friend Requests</h2>
          <p className="privacy-section-desc">Who is allowed to send you incoming friend requests.</p>
          <div className="privacy-radio-group">
            {SOCIAL_CONFIG.privacy.allowRequests.map(opt => (
              <label
                key={opt.id}
                className={`privacy-radio-label ${allowRequests === opt.id ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="allowRequests"
                  value={opt.id}
                  checked={allowRequests === opt.id}
                  onChange={() => setAllowRequests(opt.id)}
                  className="privacy-radio-input"
                />
                <div className="privacy-radio-text">
                  <span className="privacy-radio-title">{opt.label}</span>
                  <span className="privacy-radio-sub">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 2. Friends Visibility */}
        <div className="privacy-section-card">
          <h2 className="privacy-section-title">Friends List Visibility</h2>
          <p className="privacy-section-desc">Choose who can view your friends list on your public profile.</p>
          <div className="privacy-radio-group">
            {SOCIAL_CONFIG.privacy.friendsVisibility.map(opt => (
              <label
                key={opt.id}
                className={`privacy-radio-label ${friendsVisibility === opt.id ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="friendsVisibility"
                  value={opt.id}
                  checked={friendsVisibility === opt.id}
                  onChange={() => setFriendsVisibility(opt.id)}
                  className="privacy-radio-input"
                />
                <div className="privacy-radio-text">
                  <span className="privacy-radio-title">{opt.label}</span>
                  <span className="privacy-radio-sub">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Notification Muting */}
        <div className="privacy-section-card">
          <h2 className="privacy-section-title">Mute Notifications</h2>
          <p className="privacy-section-desc">Muted notifications will not increment your unread badge or generate inbox alerts.</p>
          <div className="privacy-checkbox-group">
            {SOCIAL_CONFIG.privacy.mutedTypes.map(opt => {
              const isMuted = mutedTypes.includes(opt.id);
              return (
                <label key={opt.id} className="privacy-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isMuted}
                    onChange={() => handleToggleMute(opt.id)}
                  />
                  <span>Mute {opt.label.toLowerCase()}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Save Bar */}
        <div className="privacy-save-bar">
          {feedback && <span className="privacy-feedback-msg">{feedback}</span>}
          <button
            type="submit"
            className="privacy-btn-save"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

