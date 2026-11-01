export class AudioJitterBuffer {
  private queue: Float32Array[] = [];
  private totalBufferedSamples: number = 0;
  private sampleRate: number;
  private targetBufferSeconds: number;

  constructor(sampleRate: number = 24000, targetBufferMs: number = 60) {
    this.sampleRate = sampleRate;
    this.targetBufferSeconds = targetBufferMs / 1000.0;
  }

  public pushChunk(samples: Float32Array): void {
    this.queue.push(samples);
    this.totalBufferedSamples += samples.length;
  }

  public pullChunk(): Float32Array | null {
    if (this.queue.length === 0) return null;
    const chunk = this.queue.shift()!;
    this.totalBufferedSamples -= chunk.length;
    return chunk;
  }

  public getBufferedDurationMs(): number {
    return (this.totalBufferedSamples / this.sampleRate) * 1000.0;
  }

  public isReadyToPlay(): boolean {
    return this.getBufferedDurationMs() >= this.targetBufferSeconds * 1000.0;
  }

  /**
   * Instantly purges all queued audio packets during barge-in interrupt
   */
  public flush(): void {
    this.queue = [];
    this.totalBufferedSamples = 0;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
