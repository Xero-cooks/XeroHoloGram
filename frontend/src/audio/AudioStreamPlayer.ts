/**
 * AudioStreamPlayer.ts
 * Real-time low-latency audio stream player with master gain volume boost (make it loud),
 * encoded MP3/WAV chunk decoding via WebAudio, and 512-bin FFT frequency analysis.
 */

export class AudioStreamPlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 2.5; // 250% High-Loudness Volume Boost
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private sampleRate: number;
  private freqBuffer: Uint8Array = new Uint8Array(256);

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: this.sampleRate });
      
      // Master Gain Node for loud amplification
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      // FFT Analyser Node for Viseme and Formant tracking
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;

      // Pipeline: Source -> MasterGain -> Analyser -> Destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.freqBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public unlockAudioContext(): void {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public setVolume(level: number): void {
    this.volume = Math.max(0.0, Math.min(level, 5.0)); // Clamp between 0% and 500%
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public playChunk(float32Samples: Float32Array): void {
    if (!float32Samples || float32Samples.length === 0) return;

    const ctx = this.initContext();
    const buffer = ctx.createBuffer(1, float32Samples.length, this.sampleRate);
    buffer.copyToChannel(float32Samples as any, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    if (this.masterGain) {
      source.connect(this.masterGain);
    } else if (this.analyser) {
      source.connect(this.analyser);
    } else {
      source.connect(ctx.destination);
    }

    const now = ctx.currentTime;
    const startTime = Math.max(now, this.nextPlayTime);
    source.start(startTime);

    this.nextPlayTime = startTime + buffer.duration;
    this.activeSources.push(source);

    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
  }

  /**
   * Plays an encoded audio frame (MP3/WAV/AAC) by decoding via WebAudio decodeAudioData
   */
  public async playEncodedChunk(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return;

    const ctx = this.initContext();
    try {
      // slice buffer copy to prevent detached arrayBuffer issues
      const bufferCopy = arrayBuffer.slice(0);
      const audioBuffer = await ctx.decodeAudioData(bufferCopy);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.masterGain) {
        source.connect(this.masterGain);
      } else {
        source.connect(ctx.destination);
      }

      const now = ctx.currentTime;
      const startTime = Math.max(now, this.nextPlayTime);
      source.start(startTime);

      this.nextPlayTime = startTime + audioBuffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
      };
    } catch (e) {
      console.warn('[AudioStreamPlayer] Failed to decode audio buffer chunk:', e);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.freqBuffer as any);
    }
    return this.freqBuffer;
  }

  /**
   * Instantly stops all in-flight audio buffers during barge-in
   */
  public flush(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Source may have already terminated
      }
    }
    this.activeSources = [];
    if (this.ctx) {
      this.nextPlayTime = this.ctx.currentTime;
    }
  }

  public getPlaybackRemainingSec(): number {
    if (!this.ctx) return 0;
    return Math.max(0, this.nextPlayTime - this.ctx.currentTime);
  }
}
