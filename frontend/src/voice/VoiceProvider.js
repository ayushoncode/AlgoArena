/**
 * frontend/src/voice/VoiceProvider.js
 *
 * Abstract interface for real-time voice providers.
 * Decouples the AlgoArena battle UI from provider-specific WebRTC details.
 */

export class VoiceProvider {
  /**
   * Connect to a voice session using a server-issued token.
   * @param {Object} options
   * @param {string} options.url - WebSocket URL for provider signaling
   * @param {string} options.token - Short-lived join token
   * @returns {Promise<void>}
   */
  async connect({ url, token }) {
    throw new Error('VoiceProvider.connect() must be implemented.');
  }

  /**
   * Disconnect from the active voice session and release all audio tracks.
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('VoiceProvider.disconnect() must be implemented.');
  }

  /**
   * Enable or disable the local microphone.
   * @param {boolean} enabled
   * @returns {Promise<void>}
   */
  async setMicEnabled(enabled) {
    throw new Error('VoiceProvider.setMicEnabled() must be implemented.');
  }

  /**
   * Set output volume for remote participant audio (0.0 to 1.0).
   * @param {number} volume
   */
  setOutputVolume(volume) {
    throw new Error('VoiceProvider.setOutputVolume() must be implemented.');
  }

  /**
   * Change microphone input device.
   * @param {string} deviceId
   * @returns {Promise<void>}
   */
  async setInputDevice(deviceId) {
    throw new Error('VoiceProvider.setInputDevice() must be implemented.');
  }

  /**
   * Change speaker output device (if supported by browser).
   * @param {string} deviceId
   * @returns {Promise<void>}
   */
  async setOutputDevice(deviceId) {
    throw new Error('VoiceProvider.setOutputDevice() must be implemented.');
  }

  /**
   * Register a callback for active speaker changes.
   * @param {(speakers: Array<{ identity: string, isSpeaking: boolean, audioLevel: number }>) => void} callback
   */
  onSpeaking(callback) {
    throw new Error('VoiceProvider.onSpeaking() must be implemented.');
  }

  /**
   * Register a callback for connection quality changes (good, fair, poor).
   * @param {(quality: { rating: 'good' | 'fair' | 'poor', rtt: number, jitter: number, packetLoss: number, bitrate: number }) => void} callback
   */
  onQuality(callback) {
    throw new Error('VoiceProvider.onQuality() must be implemented.');
  }

  /**
   * Register a callback for provider lifecycle events (connected, reconnecting, reconnected, disconnected, error).
   * @param {(event: string, data?: any) => void} callback
   */
  onEvent(callback) {
    throw new Error('VoiceProvider.onEvent() must be implemented.');
  }
}

