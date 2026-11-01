export class AudioStreamPlayer {
  private ctx: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private sampleRate: number;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: this.sampleRate });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playChunk(float32Samples: Float32Array): void {
    const ctx = this.initContext();
    const buffer = ctx.createBuffer(1, float32Samples.length, this.sampleRate);
    buffer.copyToChannel(float32Samples, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

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
