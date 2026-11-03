/**
 * backend/config/voice.js
 *
 * Backend configuration for Live Voice feature flags, credentials, limits,
 * and session policies.
 */

'use strict';

module.exports = {
  // Feature flags (default off)
  get isVoiceEnabled() {
    return process.env.VOICE_ENABLED === 'true';
  },

  get betaUserIds() {
    const raw = process.env.VOICE_BETA_USER_IDS || '';
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  },

  get requireBothPremium() {
    return process.env.VOICE_REQUIRE_BOTH_PREMIUM !== 'false';
  },

  // LiveKit credentials
  get livekitUrl() {
    return process.env.LIVEKIT_URL || '';
  },
  get livekitApiKey() {
    return process.env.LIVEKIT_API_KEY || '';
  },
  get livekitApiSecret() {
    return process.env.LIVEKIT_API_SECRET || '';
  },

  // Secret salt for deriving anonymous provider room IDs from match IDs
  get voiceSecretSalt() {
    return process.env.VOICE_SECRET_SALT || process.env.JWT_SECRET || 'voice_salt_algoarena';
  },

  // Limits and thresholds
  maxConcurrentSessions: parseInt(process.env.VOICE_MAX_CONCURRENT_SESSIONS, 10) || 50,
  dailyLimitMinutes: parseInt(process.env.VOICE_DAILY_LIMIT_MINUTES, 10) || 120,
  idleTimeoutSeconds: parseInt(process.env.VOICE_IDLE_TIMEOUT_SECONDS, 10) || 300,
  postMatchSeconds: parseInt(process.env.VOICE_POST_MATCH_SECONDS, 10) || 0,
  tokenTtlSeconds: 120, // 2 minutes short-lived join token
  requestExpirySeconds: 30, // 30-second handshake countdown
  maxRequestsPerMatch: 2, // Max consent requests per match

  // Telemetry threshold
  alertThresholdRatio: 0.8 // Log alert when 80% of limit reached
};

