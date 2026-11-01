export class MicCaptureStream {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentVolumeRms: number = 0;
  private isMuted: boolean = false;

  public async start(): Promise<void> {
    if (this.mediaStream) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioCtx({ sampleRate: 16000 });
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    this.sourceNode.connect(this.analyser);
  }

  public getVolumeRms(): number {
    if (!this.analyser || this.isMuted) return 0;

    const data = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    this.currentVolumeRms = Math.sqrt(sum / data.length);
    return this.currentVolumeRms;
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      for (const track of this.mediaStream.getAudioTracks()) {
        track.enabled = !muted;
      }
    }
  }

  public stop(): void {
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.sourceNode = null;
    this.analyser = null;
    this.currentVolumeRms = 0;
  }
}
