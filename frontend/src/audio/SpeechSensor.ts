import { ClientVAD, VADConfig } from './ClientVAD';

export interface SpeechSensorCallbacks {
  onVADSpeechStart: () => void;
  onVADSpeechEnd?: () => void;
  onInterimStable: (interimText: string) => void;
  onFinalTranscript: (finalText: string) => void;
  onRMSUpdate?: (rms: number, isSpeaking: boolean) => void;
}

export interface SpeechSensorOptions {
  energyThreshold?: number;
  speechHangoverMs?: number;
  silenceEndpointMs?: number;
  minSpeechDurationMs?: number;
  language?: string;
}

export class SpeechSensor {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private callbacks: SpeechSensorCallbacks;
  private vad: ClientVAD;

  private isListening: boolean = false;
  private isUserSpeaking: boolean = false;
  private pendingInterimText: string = "";
  private lastStabilizedText: string = "";
  private lastCommittedText: string = "";
  private lastCommittedTime: number = 0;
  private postCommitCooldownUntil: number = 0; // Grace period after turn commit to prevent false barge-in
  
  // Timing parameters
  private silenceEndpointMs: number = 750; // Milliseconds of silence after speech to trigger turn finalization
  private endpointTimer: any = null;
  private interimStabilizeTimer: any = null;
  private restartTimeout: any = null;
  private animFrameId: number | null = null;
  private language: string = 'en-US';

  constructor(callbacks: SpeechSensorCallbacks, options?: SpeechSensorOptions) {
    this.callbacks = callbacks;
    this.silenceEndpointMs = options?.silenceEndpointMs ?? 750;
    this.language = options?.language ?? 'en-US';

    const vadConfig: VADConfig = {
      energyThreshold: options?.energyThreshold ?? 0.025,
      speechHangoverMs: options?.speechHangoverMs ?? 350,
      minSpeechDurationMs: options?.minSpeechDurationMs ?? 40
    };

    this.vad = new ClientVAD(vadConfig, {
      onSpeechStart: () => this.handleVADOnset(),
      onSpeechEnd: () => this.handleVADOffset()
    });
  }

  public async start(): Promise<void> {
    if (this.isListening) return;

    // 1. Initialize Web Audio Hardware Stream & VAD Analyser
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false,
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      this.isListening = true;
      this.monitorVADLoop();
    } catch (err) {
      console.warn('[SpeechSensor] Microphone capture unavailable or permission denied:', err);
    }

    // 2. Initialize Browser STT (Web Speech API)
    this.initSpeechRecognition();
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[SpeechSensor] Browser SpeechRecognition API not supported.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.language;

      this.recognition.onstart = () => {
        // Recognition loop active
      };

      this.recognition.onspeechstart = () => {
        this.handleVADOnset();
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let finalFromBrowser = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalFromBrowser += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        const incomingText = (finalFromBrowser || interim).trim();
        if (incomingText) {
          this.handleIncomingSpeechText(incomingText, !!finalFromBrowser);
        }
      };

      this.recognition.onerror = (event: any) => {
        // Non-fatal recognition events
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('[SpeechSensor] SpeechRecognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        // Web Speech API terminates on silence or timeouts; auto-restart if still listening
        if (this.isListening) {
          if (this.restartTimeout) clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isListening) {
              try {
                this.recognition?.start();
              } catch {
                // Ignore if already active
              }
            }
          }, 80);
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn('[SpeechSensor] Failed to start SpeechRecognition:', err);
    }
  }

  private handleVADOnset(): void {
    // If in post-turn commit cooldown, ignore false ambient onsets
    if (performance.now() < this.postCommitCooldownUntil) {
      return;
    }

    if (!this.isUserSpeaking) {
      this.isUserSpeaking = true;
      // Immediate reflex barge-in notification
      this.callbacks.onVADSpeechStart();
    }
    // Clear any pending endpoint timer since user is currently speaking
    if (this.endpointTimer) {
      clearTimeout(this.endpointTimer);
      this.endpointTimer = null;
    }
  }

  private handleVADOffset(): void {
    this.callbacks.onVADSpeechEnd?.();
    // Start silence endpointing timer to finalize the turn
    this.scheduleEndpointCommit();
  }

  private handleIncomingSpeechText(text: string, isBrowserFinal: boolean): void {
    // Ignore residual echoes of already committed text during cooldown
    if (performance.now() < this.postCommitCooldownUntil && text === this.lastCommittedText) {
      return;
    }

    // If text arrived, user is speaking
    this.handleVADOnset();
    this.pendingInterimText = text;

    // Speculative interim preview stabilization (>250ms)
    if (text !== this.lastStabilizedText) {
      this.lastStabilizedText = text;
      if (this.interimStabilizeTimer) clearTimeout(this.interimStabilizeTimer);
      this.interimStabilizeTimer = setTimeout(() => {
        if (this.pendingInterimText) {
          this.callbacks.onInterimStable(this.pendingInterimText);
        }
      }, 250);
    }

    // If browser emitted isFinal, or schedule silence endpointing
    if (isBrowserFinal) {
      this.commitFinalTurn(text);
    } else {
      this.scheduleEndpointCommit();
    }
  }

  private scheduleEndpointCommit(): void {
    if (this.endpointTimer) {
      clearTimeout(this.endpointTimer);
    }

    // Silence Endpointing Timer:
    // If user stops speaking and stays silent for silenceEndpointMs, commit turn!
    this.endpointTimer = setTimeout(() => {
      if (this.pendingInterimText && this.pendingInterimText.trim().length > 0) {
        this.commitFinalTurn(this.pendingInterimText.trim());
      } else {
        this.isUserSpeaking = false;
      }
    }, this.silenceEndpointMs);
  }

  private commitFinalTurn(finalText: string): void {
    if (this.endpointTimer) {
      clearTimeout(this.endpointTimer);
      this.endpointTimer = null;
    }
    if (this.interimStabilizeTimer) {
      clearTimeout(this.interimStabilizeTimer);
      this.interimStabilizeTimer = null;
    }

    const trimmed = finalText.trim();
    if (!trimmed) {
      this.isUserSpeaking = false;
      return;
    }

    // Suppress duplicate turn commits within 1500ms
    const now = performance.now();
    const normIncoming = trimmed.toLowerCase().replace(/[.,!?;:]/g, '');
    const normLast = this.lastCommittedText.toLowerCase().replace(/[.,!?;:]/g, '');
    if ((now - this.lastCommittedTime) < 1500 && normIncoming === normLast) {
      console.log('[SpeechSensor] Duplicate turn commit suppressed:', trimmed);
      this.isUserSpeaking = false;
      return;
    }

    this.isUserSpeaking = false;
    this.pendingInterimText = "";
    this.lastStabilizedText = "";
    this.lastCommittedText = trimmed;
    this.lastCommittedTime = now;
    this.postCommitCooldownUntil = now + 1200; // 1.2s guard to prevent self-interruption
    this.vad.reset();

    // Trigger turn completion
    this.callbacks.onFinalTranscript(trimmed);
  }

  private monitorVADLoop = (): void => {
    if (!this.analyser || !this.isListening) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    const now = performance.now();
    const isSpeaking = this.vad.processAudioFrame(buffer, now);
    const rms = this.vad.getCurrentRMS();

    // Notify live VU meter
    this.callbacks.onRMSUpdate?.(rms, isSpeaking);

    this.animFrameId = requestAnimationFrame(this.monitorVADLoop);
  };

  public setEnergyThreshold(threshold: number): void {
    this.vad.setEnergyThreshold(threshold);
  }

  public setSpeechHangoverMs(ms: number): void {
    this.vad.setSpeechHangoverMs(ms);
  }

  public setSilenceEndpointMs(ms: number): void {
    this.silenceEndpointMs = Math.max(300, Math.min(ms, 2500));
  }

  public setLanguage(lang: string): void {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public getRMS(): number {
    return this.vad.getCurrentRMS();
  }

  public getIsSpeaking(): boolean {
    return this.isUserSpeaking || this.vad.getIsSpeaking();
  }

  public stop(): void {
    this.isListening = false;
    this.isUserSpeaking = false;
    this.pendingInterimText = "";

    if (this.endpointTimer) clearTimeout(this.endpointTimer);
    if (this.interimStabilizeTimer) clearTimeout(this.interimStabilizeTimer);
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.vad.reset();
  }
}
