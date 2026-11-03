/**
 * frontend/src/voice/LiveKitVoiceProvider.js
 *
 * LiveKit implementation of VoiceProvider.
 * Configures WebRTC audio with Opus speech preset (mono, DTX, FEC).
 * Handles room events, speaking indicators, device changes, and quality sampling.
 */

import {
  Room,
  RoomEvent,
  Track,
  AudioPresets,
  ConnectionQuality,
} from 'livekit-client';
import { VoiceProvider } from './VoiceProvider';
import { VOICE_CONFIG } from '../content/voice';

export class LiveKitVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.room = null;
    this.audioElement = null;
    this.outputVolume = 1.0;
    this.statsInterval = null;
    this.speakingCallback = null;
    this.qualityCallback = null;
    this.eventCallback = null;
    this.lastStats = null;
    this.qualityCounts = { good: 0, fair: 0, poor: 0 };
    this.localAudioCtx = null;
    this.localMeterAnimId = null;
  }

  async connect({ url, token }) {
    if (this.room) {
      await this.disconnect();
    }

    this.room = new Room({
      adaptiveStream: true,
      dynacast: false, // audio-only
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: VOICE_CONFIG.channels,
      },
      publishDefaults: {
        audioPreset: AudioPresets.SPEECH,
        dtx: true,
        red: true,
      },
      stopLocalTrackOnUnpublish: true,
    });

    this._setupListeners();

    // Connect to room
    await this.room.connect(url, token, {
      autoSubscribe: true,
    });

    if (typeof window !== 'undefined') {
      window.__livekit_room = this.room;
    }

    // Ensure local mic starts muted upon connect
    await this.room.localParticipant.setMicrophoneEnabled(false);

    // Call startAudio to enable AudioContext playback in Safari / iOS
    try {
      if (typeof this.room.startAudio === 'function') {
        await this.room.startAudio();
      }
    } catch (e) {
      console.warn('[LiveKitVoiceProvider] startAudio notice:', e);
    }

    this._startStatsMonitoring();
  }

  _setupListeners() {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      this._emitEvent('connected');
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      this._emitEvent('reconnecting');
    });

    this.room.on(RoomEvent.Reconnected, () => {
      this._emitEvent('reconnected');
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      this._emitEvent('disconnected', { reason });
      this._stopStatsMonitoring();
    });

    // Subscribe to remote audio track
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        if (!this.audioElement) {
          this.audioElement = document.createElement('audio');
          this.audioElement.autoplay = true;
          this.audioElement.style.display = 'none';
          document.body.appendChild(this.audioElement);
        }
        track.attach(this.audioElement);
        this.audioElement.volume = this.outputVolume;
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track) => {
      if (track.kind === Track.Kind.Audio && this.audioElement) {
        track.detach(this.audioElement);
      }
    });

    // Active speakers detection
    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      if (this.speakingCallback) {
        const mapped = speakers.map(s => ({
          identity: s.identity,
          isSpeaking: s.isSpeaking,
          audioLevel: s.audioLevel,
        }));
        this.speakingCallback(mapped);
      }
    });

    // Native connection quality events
    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      let rating = 'good';
      if (quality === ConnectionQuality.Poor) rating = 'poor';
      else if (quality === ConnectionQuality.Good) rating = 'fair';
      else if (quality === ConnectionQuality.Excellent) rating = 'good';

      if (this.qualityCounts[rating] !== undefined) {
        this.qualityCounts[rating]++;
      }
    });
  }

  async setMicEnabled(enabled) {
    if (!this.room || !this.room.localParticipant) return;
    await this.room.localParticipant.setMicrophoneEnabled(enabled, {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      channelCount: VOICE_CONFIG.channels,
    });

    if (enabled) {
      this._startLocalMeter();
    } else {
      this._stopLocalMeter();
    }
  }

  _startLocalMeter() {
    this._stopLocalMeter();
    try {
      const pub = this.room?.localParticipant?.getTrackPublication(Track.Source.Microphone);
      const mediaStreamTrack = pub?.track?.mediaStreamTrack;
      if (!mediaStreamTrack) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      this.localAudioCtx = audioCtx;
      const stream = new MediaStream([mediaStreamTrack]);
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const myIdentity = this.room?.localParticipant?.identity;

      const update = () => {
        if (!this.localAudioCtx || !analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, Math.max(0, (avg - 10) / 100)); // normalized 0.0 to 1.0

        if (this.speakingCallback && myIdentity) {
          this.speakingCallback([{
            identity: myIdentity,
            isSpeaking: normalized > 0.08,
            audioLevel: normalized,
          }]);
        }
        this.localMeterAnimId = requestAnimationFrame(update);
      };
      this.localMeterAnimId = requestAnimationFrame(update);
    } catch (e) {
      console.warn('[LiveKitVoiceProvider] local meter notice:', e);
    }
  }

  _stopLocalMeter() {
    if (this.localMeterAnimId) {
      cancelAnimationFrame(this.localMeterAnimId);
      this.localMeterAnimId = null;
    }
    if (this.localAudioCtx) {
      this.localAudioCtx.close().catch(() => {});
      this.localAudioCtx = null;
    }
    if (this.speakingCallback && this.room?.localParticipant?.identity) {
      this.speakingCallback([{
        identity: this.room.localParticipant.identity,
        isSpeaking: false,
        audioLevel: 0,
      }]);
    }
  }

  setOutputVolume(volume) {
    this.outputVolume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.outputVolume;
    }
  }

  async setInputDevice(deviceId) {
    if (!this.room) return;
    await this.room.switchActiveDevice('audioinput', deviceId);
  }

  async setOutputDevice(deviceId) {
    if (!this.room) return;
    if (this.audioElement && typeof this.audioElement.setSinkId === 'function') {
      try {
        await this.audioElement.setSinkId(deviceId);
      } catch (err) {
        console.warn('[VoiceProvider] setSinkId failed:', err.message);
      }
    }
  }

  onSpeaking(callback) {
    this.speakingCallback = callback;
  }

  onQuality(callback) {
    this.qualityCallback = callback;
  }

  onEvent(callback) {
    this.eventCallback = callback;
  }

  _emitEvent(event, data) {
    if (this.eventCallback) {
      this.eventCallback(event, data);
    }
  }

  _startStatsMonitoring() {
    this._stopStatsMonitoring();
    this.statsInterval = setInterval(async () => {
      if (!this.room || !this.qualityCallback) return;
      try {
        // Sample WebRTC peer connection stats
        const pc = this.room.engine?.client?.pc;
        if (!pc || typeof pc.getStats !== 'function') return;

        const statsReport = await pc.getStats();
        let rtt = 0;
        let jitter = 0;
        let packetLoss = 0;
        let bitrate = 0;

        for (const report of statsReport.values()) {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = Math.round((report.currentRoundTripTime || 0) * 1000);
          } else if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            jitter = Math.round((report.jitter || 0) * 1000);
            const totalPackets = (report.packetsReceived || 0) + (report.packetsLost || 0);
            packetLoss = totalPackets > 0 ? Number(((report.packetsLost || 0) / totalPackets * 100).toFixed(1)) : 0;
            if (this.lastStats && this.lastStats.timestamp) {
              const deltaBytes = (report.bytesReceived || 0) - (this.lastStats.bytesReceived || 0);
              const deltaSec = (report.timestamp - this.lastStats.timestamp) / 1000;
              if (deltaSec > 0 && deltaBytes >= 0) {
                bitrate = Math.round((deltaBytes * 8) / deltaSec);
              }
            }
            this.lastStats = {
              timestamp: report.timestamp,
              bytesReceived: report.bytesReceived || 0,
            };
          }
        }

        let rating = 'good';
        const qCfg = VOICE_CONFIG.quality;
        if (rtt > qCfg.fair.maxRttMs || jitter > qCfg.fair.maxJitterMs || packetLoss > qCfg.fair.maxPacketLossPct) {
          rating = 'poor';
        } else if (rtt > qCfg.good.maxRttMs || jitter > qCfg.good.maxJitterMs || packetLoss > qCfg.good.maxPacketLossPct) {
          rating = 'fair';
        }

        this.qualityCounts[rating]++;
        this.qualityCallback({ rating, rtt, jitter, packetLoss, bitrate });
      } catch (err) {
        // Non-blocking telemetry error
      }
    }, VOICE_CONFIG.statsSampleIntervalMs);
  }

  _stopStatsMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  getQualitySummary() {
    return { ...this.qualityCounts };
  }

  async disconnect() {
    this._stopLocalMeter();
    this._stopStatsMonitoring();
    if (this.room) {
      try {
        // Explicitly unpublish and stop all local tracks to shut off microphone hardware indicator
        if (this.room.localParticipant) {
          for (const pub of this.room.localParticipant.audioTrackPublications.values()) {
            if (pub.track) {
              pub.track.stop();
              await this.room.localParticipant.unpublishTrack(pub.track);
            }
          }
        }
        await this.room.disconnect(true);
      } catch (err) {
        console.warn('[VoiceProvider] Disconnect cleanup notice:', err.message);
      }
      this.room = null;
    }

    if (this.audioElement) {
      this.audioElement.srcObject = null;
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
      this.audioElement = null;
    }
  }
}

