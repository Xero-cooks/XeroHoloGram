export type WSMessageHandler = (data: any) => void;
export type WSAudioHandler = (header: { seqId: number; sampleRate: number; numSamples: number; flags: number }, pcm: Float32Array) => void;

export class HologramWSClient {
  private url: string;
  private ws: WebSocket | null = null;
  private isExplicitlyClosed: boolean = false;
  private reconnectAttempts: number = 0;
  private messageHandlers: WSMessageHandler[] = [];
  private audioHandlers: WSAudioHandler[] = [];

  constructor(url: string = 'ws://localhost:8765/ws/hologram') {
    this.url = url;
  }

  public connect(): void {
    this.isExplicitlyClosed = false;
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('[HologramWSClient] Connected to backend multiplexer.');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          for (const handler of this.messageHandlers) {
            handler(parsed);
          }
        } catch (err) {
          console.error('[HologramWSClient] JSON parse error:', err);
        }
      } else if (event.data instanceof ArrayBuffer) {
        this.parseBinaryAudio(event.data);
      }
    };

    this.ws.onclose = () => {
      if (!this.isExplicitlyClosed) {
        const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
      }
    };
  }

  private parseBinaryAudio(buffer: ArrayBuffer): void {
    if (buffer.byteLength < 16) return;

    const view = new DataView(buffer);
    const seqId = view.getUint32(0, true);
    const sampleRate = view.getUint32(4, true);
    const numSamples = view.getUint32(8, true);
    const flags = view.getUint32(12, true);

    // Audio payload: Int16 samples normalized to Float32 [-1.0, 1.0]
    const int16Samples = new Int16Array(buffer, 16);
    const float32Samples = new Float32Array(int16Samples.length);

    for (let i = 0; i < int16Samples.length; i++) {
      float32Samples[i] = int16Samples[i] / 32768.0;
    }

    for (const handler of this.audioHandlers) {
      handler({ seqId, sampleRate, numSamples, flags }, float32Samples);
    }
  }

  public sendJSON(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public onMessage(handler: WSMessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  public onAudio(handler: WSAudioHandler): () => void {
    this.audioHandlers.push(handler);
    return () => {
      this.audioHandlers = this.audioHandlers.filter(h => h !== handler);
    };
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
