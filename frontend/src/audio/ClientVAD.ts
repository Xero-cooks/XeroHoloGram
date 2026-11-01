export interface VADConfig {
  energyThreshold: number; // RMS threshold (0.015 - 0.08)
  speechHangoverMs: number; // Grace period after voice drops (300 - 450ms)
  minSpeechDurationMs: number; // Minimum speech trigger (40 - 80ms)
}

export class ClientVAD {
  private config: VADConfig;
  private isSpeaking: boolean = false;
  private speechStartTime: number | null = null;
  private lastSpeechTime: number = 0;
  private currentRMS: number = 0.0;
  private noiseFloor: number = 0.01;
  private onSpeechStart?: () => void;
  private onSpeechEnd?: () => void;

  constructor(
    config: VADConfig = { energyThreshold: 0.025, speechHangoverMs: 350, minSpeechDurationMs: 50 },
    callbacks?: { onSpeechStart?: () => void; onSpeechEnd?: () => void }
  ) {
    this.config = { ...config };
    this.onSpeechStart = callbacks?.onSpeechStart;
    this.onSpeechEnd = callbacks?.onSpeechEnd;
  }

  public processAudioFrame(samples: Float32Array, currentTimeMs: number): boolean {
    if (!samples || samples.length === 0) return this.isSpeaking;

    // 1. Compute RMS energy
    let sumSquares = 0.0;
    for (let i = 0; i < samples.length; i++) {
      sumSquares += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sumSquares / samples.length);
    this.currentRMS = rms;

    // 2. Adaptive noise floor tracking during silence
    if (!this.isSpeaking) {
      this.noiseFloor = this.noiseFloor * 0.992 + rms * 0.008;
    }

    // Dynamic threshold takes into account calibrated user baseline + ambient noise floor
    const effectiveThreshold = Math.max(this.config.energyThreshold, this.noiseFloor + 0.012);
    const exceedsThreshold = rms >= effectiveThreshold;

    if (exceedsThreshold) {
      this.lastSpeechTime = currentTimeMs;
      if (!this.isSpeaking) {
        if (this.speechStartTime === null) {
          this.speechStartTime = currentTimeMs;
        } else if (currentTimeMs - this.speechStartTime >= this.config.minSpeechDurationMs) {
          this.isSpeaking = true;
          this.onSpeechStart?.();
        }
      }
    } else {
      if (this.isSpeaking) {
        // Hangover period check
        if (currentTimeMs - this.lastSpeechTime >= this.config.speechHangoverMs) {
          this.isSpeaking = false;
          this.speechStartTime = null;
          this.onSpeechEnd?.();
        }
      } else {
        this.speechStartTime = null;
      }
    }

    return this.isSpeaking;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getCurrentRMS(): number {
    return this.currentRMS;
  }

  public getNoiseFloor(): number {
    return this.noiseFloor;
  }

  public setEnergyThreshold(val: number): void {
    this.config.energyThreshold = Math.max(0.005, Math.min(val, 0.2));
  }

  public setSpeechHangoverMs(ms: number): void {
    this.config.speechHangoverMs = Math.max(100, Math.min(ms, 1200));
  }

  public setMinSpeechDurationMs(ms: number): void {
    this.config.minSpeechDurationMs = Math.max(20, Math.min(ms, 300));
  }

  public reset(): void {
    this.isSpeaking = false;
    this.speechStartTime = null;
    this.lastSpeechTime = 0;
    this.currentRMS = 0.0;
  }
}
