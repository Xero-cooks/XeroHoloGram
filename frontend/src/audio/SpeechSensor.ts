export interface SpeechSensorCallbacks {
  onVADSpeechStart: () => void;
  onInterimStable: (interimText: string) => void;
  onFinalTranscript: (finalText: string) => void;
}

export class SpeechSensor {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private callbacks: SpeechSensorCallbacks;

  private lastInterimText: string = "";
  private interimStabilizeTimer: any = null;
  private isListening: boolean = false;
  private isSpeakingVAD: boolean = false;

  constructor(callbacks: SpeechSensorCallbacks) {
    this.callbacks = callbacks;
  }

  public async start(): Promise<void> {
    if (this.isListening) return;

    // 1. Initialize Web Audio VAD
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.monitorVADLoop();
    } catch (err) {
      console.warn('[SpeechSensor] Microphone capture unavailable:', err);
    }

    // 2. Initialize Browser STT
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalText = event.results[i][0].transcript.trim();
            if (finalText) {
              this.callbacks.onFinalTranscript(finalText);
              this.lastInterimText = "";
              if (this.interimStabilizeTimer) clearTimeout(this.interimStabilizeTimer);
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim.trim()) {
          this.handleInterimText(interim.trim());
        }
      };

      this.recognition.start();
    }

    this.isListening = true;
  }

  private handleInterimText(text: string): void {
    if (text === this.lastInterimText) return;
    this.lastInterimText = text;

    if (this.interimStabilizeTimer) clearTimeout(this.interimStabilizeTimer);
    // When interim speech stabilizes for >350ms, fire speculative preview
    this.interimStabilizeTimer = setTimeout(() => {
      this.callbacks.onInterimStable(this.lastInterimText);
    }, 350);
  }

  private monitorVADLoop = (): void => {
    if (!this.analyser || !this.isListening) return;

    const data = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);

    if (rms > 0.035) {
      if (!this.isSpeakingVAD) {
        this.isSpeakingVAD = true;
        // Immediate reflex barge-in (<30ms)
        this.callbacks.onVADSpeechStart();
      }
    } else {
      this.isSpeakingVAD = false;
    }

    requestAnimationFrame(this.monitorVADLoop);
  };

  public stop(): void {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
