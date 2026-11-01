export interface VADConfig {
  energyThreshold: number; // RMS threshold (0.015 - 0.05)
  speechHangoverMs: number; // Grace period after voice drops (250ms)
  minSpeechDurationMs: number; // Minimum speech trigger (80ms)
}

export class ClientVAD {
  private config: VADConfig;
  private isSpeaking: boolean = false;
  private speechStartTime: number | null = null;
  private lastSpeechTime: number = 0;
  private onSpeechStart?: () => void;
  private onSpeechEnd?: () => void;

  constructor(
    config: VADConfig = { energyThreshold: 0.025, speechHangoverMs: 300, minSpeechDurationMs: 80 },
    callbacks?: { onSpeechStart?: () => void; onSpeechEnd?: () => void }
  ) {
    this.config = config;
    this.onSpeechStart = callbacks?.onSpeechStart;
    this.onSpeechEnd = callbacks?.onSpeechEnd;
  }

  public processAudioFrame(samples: Float32Array, currentTimeMs: number): boolean {
    // 1. Compute RMS energy
    let sumSquares = 0.0;
    for (let i = 0; i < samples.length; i++) {
      sumSquares += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sumSquares / (samples.length || 1));

    // 2. Check threshold
    const exceedsThreshold = rms >= this.config.energyThreshold;

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
}
