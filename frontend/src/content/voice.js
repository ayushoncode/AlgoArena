/**
 * frontend/src/content/voice.js
 *
 * Single content and configuration file for Live Voice feature.
 * Plain language, strict tokens, zero emoji, zero em dashes.
 */

export const VOICE_CONFIG = {
  // Feature identifiers
  featureKey: 'voice_chat',

  // Policy and timers
  requestExpirySeconds: 30,
  maxRequestsPerMatch: 2,
  postMatchSeconds: 0,
  pushToTalkDefault: false,
  muteToggleShortcut: 'Alt+M',

  // Audio stream targets (speech preset)
  targetBitrateBps: 28000, // 28 kbps
  sampleRate: 48000,
  channels: 1, // mono

  // WebRTC Quality Thresholds
  quality: {
    good: { maxRttMs: 150, maxJitterMs: 30, maxPacketLossPct: 2 },
    fair: { maxRttMs: 300, maxJitterMs: 60, maxPacketLossPct: 6 },
  },

  // Telemetry sampling interval
  statsSampleIntervalMs: 5000,

  // Safety categories for reporting
  reportCategories: [
    { id: 'harassment', label: 'Harassment or bullying' },
    { id: 'hate_speech', label: 'Hate speech or discrimination' },
    { id: 'threats', label: 'Threats or violence' },
    { id: 'inappropriate', label: 'Inappropriate or offensive conduct' },
    { id: 'spam', label: 'Disruption or noise spam' },
    { id: 'other', label: 'Other issue' },
  ],

  // UI Microcopy
  copy: {
    startVoice: 'Start voice',
    accept: 'Accept',
    decline: 'Decline',
    endVoice: 'End voice',
    micOn: 'Mic on',
    micOff: 'Mic off',
    micMuted: 'Muted',
    micUnmuted: 'Unmuted',
    speaking: 'Speaking',
    connecting: 'Connecting',
    connected: 'Connected',
    reconnecting: 'Reconnecting',
    connectionFailed: 'Connection failed',
    voiceEnded: 'Voice ended',
    incomingRequest: 'Opponent requested voice',
    waitingResponse: 'Waiting for opponent',
    requestDeclined: 'Request declined',
    requestExpired: 'Request expired',
    limitReached: 'Voice request limit reached for this match',
    opponentNotPremium: 'Your opponent needs Premium for voice.',
    premiumRequired: 'Premium is required to use live voice.',
    upgradeToPremium: 'Upgrade to Premium',
    privacyNotice: 'Voice is not recorded.',
    safetyNotice: 'You can mute or block anyone at any time.',
    headphoneTip: 'Headphones prevent echo.',
    pushToTalkLabel: 'Push to talk',
    pushToTalkHint: 'Hold spacebar outside code editor to speak',
    deviceSettings: 'Voice settings',
    inputDevice: 'Microphone',
    outputDevice: 'Speaker',
    testMicrophone: 'Test microphone',
    speakingLevel: 'Input level',
    muteOpponent: 'Mute opponent',
    unmuteOpponent: 'Unmute opponent',
    blockPlayer: 'Block voice from this player',
    reportVoice: 'Report voice',
    firstUseTitle: 'Live Voice in Duels',
    firstUseConsent: 'Voice is real-time and peer-to-peer over WebRTC. Voice is never recorded or stored. You can mute, block, or report at any time.',
    continueButton: 'Continue',
    inAppBrowserNotice: 'Open this page in Chrome or Safari to use voice.',
    permissionDenied: 'Microphone permission was denied. Allow microphone access in your browser settings to continue.',
    noMicrophone: 'No microphone detected on your device.',
    deviceDisconnected: 'Selected audio device was disconnected.',
    singleTabWarning: 'Voice was disconnected because you opened voice in another window or tab.',
    suspendedNotice: 'Voice is unavailable for your account until',
  }
};

