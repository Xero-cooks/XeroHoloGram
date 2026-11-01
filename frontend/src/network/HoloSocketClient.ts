/**
 * HoloSocketClient.ts
 * Unified full-duplex binary/JSON WebSocket multiplexer client.
 * Connects to ws://localhost:8765/ws/hologram
 * Handles:
 * - Ping/Pong heartbeat with round-trip latency (RTT) tracking
 * - STT interim and final transcript streaming
 * - Barge-in instant interruption packets
 * - Speculative D3 pre-warm packets
 * - Binary 24kHz PCM audio reception with 16-byte header parsing
 * - Structured D3 Kinematic Response packet dispatch
 */

export interface WSBinaryAudioHeader {
  seqId: number;
  sampleRate: number;
  numSamples: number;
  flags: number;
}

export interface D3GestureKeyframe {
  trigger_ms: number;
  duration_ms: number;
  base_preset: string;
  blend_weight: number;
  bone_angle_overrides_deg: Record<string, [number, number, number]>;
}

export interface D3KinematicPacket {
  type?: 'd3_kinematics';
  intent_class: string;
  emotion: string;
  gaze_vector: [number, number, number];
  holo_shader_state: string;
  gesture_sequence: D3GestureKeyframe[];
}

export type KinematicPacketCallback = (packet: D3KinematicPacket) => void;
export type AudioChunkCallback = (header: WSBinaryAudioHeader, pcmData: Float32Array) => void;
export type StatusCallback = (status: 'connected' | 'disconnected' | 'reconnecting' | 'error') => void;
export type RTTCallback = (rttMs: number) => void;

export class HoloSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private isExplicitlyClosed: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectDelay: number = 5000;
  
  // Latency & Heartbeat
  private pingIntervalId: any = null;
  private lastPingSentAt: number = 0;
  private currentRTT: number = 0;

  // Callbacks
  private kinematicCallbacks: Set<KinematicPacketCallback> = new Set();
  private audioCallbacks: Set<AudioChunkCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private rttCallbacks: Set<RTTCallback> = new Set();

  constructor(url: string = 'ws://localhost:8765/ws/hologram') {
    this.url = url;
  }

  public connect(): void {
    if (typeof WebSocket === 'undefined') {
      console.warn('[HoloSocketClient] WebSocket not supported in this environment.');
      return;
    }

    this.isExplicitlyClosed = false;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');
        this.startHeartbeat();
        console.log(`[HoloSocketClient] Connected to ${this.url}`);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          this.handleTextMessage(event.data);
        } else if (event.data instanceof ArrayBuffer) {
          this.handleBinaryAudio(event.data);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[HoloSocketClient] WebSocket error:', err);
        this.notifyStatus('error');
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.notifyStatus(this.isExplicitlyClosed ? 'disconnected' : 'reconnecting');
        if (!this.isExplicitlyClosed) {
          const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), delay);
        }
      };
    } catch (e) {
      console.error('[HoloSocketClient] Failed to instantiate WebSocket:', e);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingSentAt = performance.now();
        this.sendJSON({ type: 'ping', timestamp: this.lastPingSentAt });
      }
    }, 2000);
  }

  private stopHeartbeat(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private handleTextMessage(raw: string): void {
    try {
      const data = JSON.parse(raw);

      // Handle Pong / RTT
      if (data.type === 'pong' && this.lastPingSentAt > 0) {
        this.currentRTT = Math.round(performance.now() - this.lastPingSentAt);
        this.rttCallbacks.forEach(cb => cb(this.currentRTT));
        return;
      }

      // Handle D3 Kinematic Response
      if (data.type === 'd3_kinematics' || (data.gesture_sequence && Array.isArray(data.gesture_sequence))) {
        this.kinematicCallbacks.forEach(cb => cb(data as D3KinematicPacket));
      }
    } catch (e) {
      console.error('[HoloSocketClient] JSON decode failed:', e);
    }
  }

  private handleBinaryAudio(buffer: ArrayBuffer): void {
    if (buffer.byteLength < 16) return;

    const view = new DataView(buffer);
    const seqId = view.getUint32(0, true);
    const sampleRate = view.getUint32(4, true);
    const numSamples = view.getUint32(8, true);
    const flags = view.getUint32(12, true);

    const int16Samples = new Int16Array(buffer, 16);
    const float32Samples = new Float32Array(int16Samples.length);

    for (let i = 0; i < int16Samples.length; i++) {
      float32Samples[i] = int16Samples[i] / 32768.0;
    }

    const header: WSBinaryAudioHeader = { seqId, sampleRate, numSamples, flags };
    this.audioCallbacks.forEach(cb => cb(header, float32Samples));
  }

  public sendTranscript(text: string, isFinal: boolean): void {
    this.sendJSON({
      type: isFinal ? 'final_transcript' : 'interim_transcript',
      text,
      is_final: isFinal,
      client_timestamp: performance.now()
    });
  }

  public sendBargeIn(): void {
    this.sendJSON({
      type: 'barge_in',
      timestamp: performance.now()
    });
  }

  public sendVADState(isSpeaking: boolean, energy: number): void {
    this.sendJSON({
      type: 'vad_state',
      is_speaking: isSpeaking,
      energy,
      timestamp: performance.now()
    });
  }

  public sendJSON(obj: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  public onKinematics(cb: KinematicPacketCallback): () => void {
    this.kinematicCallbacks.add(cb);
    return () => this.kinematicCallbacks.delete(cb);
  }

  public onAudio(cb: AudioChunkCallback): () => void {
    this.audioCallbacks.add(cb);
    return () => this.audioCallbacks.delete(cb);
  }

  public onStatus(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  public onRTT(cb: RTTCallback): () => void {
    this.rttCallbacks.add(cb);
    return () => this.rttCallbacks.delete(cb);
  }

  public getRTT(): number {
    return this.currentRTT;
  }

  private notifyStatus(st: 'connected' | 'disconnected' | 'reconnecting' | 'error'): void {
    this.statusCallbacks.forEach(cb => cb(st));
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus('disconnected');
  }
}
