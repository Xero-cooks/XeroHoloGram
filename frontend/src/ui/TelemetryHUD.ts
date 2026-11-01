export interface TelemetryData {
  fps: number;
  rttMs: number;
  d3LatencyMs: number;
  ttsLatencyMs: number;
  activeJointCount: number;
  visemeEnergy: number;
  intentClass: string;
  emotion: string;
  shaderState: string;
  speechState: 'IDLE' | 'LISTENING' | 'SPECULATIVE' | 'SPEAKING' | 'INTERRUPTED';
}

export class TelemetryHUD {
  public leftContainer: HTMLElement | null = null;
  public rightContainer: HTMLElement | null = null;
  private isVisible: boolean = true;

  // Frame timing
  private frameCount: number = 0;
  private lastFpsUpdateTime: number = performance.now();
  private currentFps: number = 60;

  private data: TelemetryData = {
    fps: 60,
    rttMs: 12,
    d3LatencyMs: 145,
    ttsLatencyMs: 180,
    activeJointCount: 28,
    visemeEnergy: 0.0,
    intentClass: 'NEUTRAL_IDLE',
    emotion: 'attentive',
    shaderState: 'cyan_nominative',
    speechState: 'IDLE'
  };

  constructor() {
    if (typeof document !== 'undefined') {
      this.buildDOM();
    }
  }

  private buildDOM(): void {
    // Left Telemetry Box
    const leftEl = document.createElement('div');
    leftEl.id = 'holo-telemetry-left';
    leftEl.className = 'holo-hud holo-hud-left';
    leftEl.innerHTML = `
      <div class="holo-hud-title">◈ SYSTEM TELEMETRY</div>
      <div class="holo-hud-row">
        <span>FRAME RATE:</span>
        <strong id="hud-fps" class="holo-val-green">60 FPS</strong>
      </div>
      <div class="holo-hud-row">
        <span>WS RTT:</span>
        <strong id="hud-rtt" class="holo-val-cyan">-- ms</strong>
      </div>
      <div class="holo-hud-row">
        <span>D3 LATENCY:</span>
        <strong id="hud-d3" class="holo-val-cyan">-- ms</strong>
      </div>
      <div class="holo-hud-row">
        <span>TTS TTFB:</span>
        <strong id="hud-tts" class="holo-val-cyan">-- ms</strong>
      </div>
      <div class="holo-hud-row">
        <span>CANONICAL JOINTS:</span>
        <strong id="hud-joints" class="holo-val-gold">28 / 28</strong>
      </div>
      <div class="holo-hud-row">
        <span>VISEME RMS:</span>
        <div class="holo-meter"><div id="hud-meter-bar" class="holo-meter-fill"></div></div>
      </div>
    `;

    // Right Telemetry Box
    const rightEl = document.createElement('div');
    rightEl.id = 'holo-telemetry-right';
    rightEl.className = 'holo-hud holo-hud-right';
    rightEl.innerHTML = `
      <div class="holo-hud-title">◈ AGENT INTENT & STATE</div>
      <div class="holo-hud-row">
        <span>VOICE STATE:</span>
        <span id="hud-voice-state" class="holo-badge holo-badge-idle">IDLE</span>
      </div>
      <div class="holo-hud-row">
        <span>INTENT:</span>
        <span id="hud-intent" class="holo-badge holo-badge-cyan">NEUTRAL</span>
      </div>
      <div class="holo-hud-row">
        <span>EMOTION:</span>
        <strong id="hud-emotion" class="holo-val-cyan">attentive</strong>
      </div>
      <div class="holo-hud-row">
        <span>HOLO SHADER:</span>
        <strong id="hud-shader" class="holo-val-cyan">cyan_nominative</strong>
      </div>
    `;

    document.body.appendChild(leftEl);
    document.body.appendChild(rightEl);
    this.leftContainer = leftEl;
    this.rightContainer = rightEl;
  }

  public tick(deltaMs: number): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdateTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
      this.data.fps = this.currentFps;
      this.updateDOM();
    }
  }

  public updateData(partial: Partial<TelemetryData>): void {
    this.data = { ...this.data, ...partial };
    this.updateDOM();
  }

  private updateDOM(): void {
    if (!this.leftContainer || !this.rightContainer) return;

    // Left HUD elements
    const fpsEl = this.leftContainer.querySelector('#hud-fps');
    if (fpsEl) {
      fpsEl.textContent = `${this.data.fps} FPS`;
      fpsEl.className = this.data.fps >= 55 ? 'holo-val-green' : this.data.fps >= 30 ? 'holo-val-gold' : 'holo-val-red';
    }

    const rttEl = this.leftContainer.querySelector('#hud-rtt');
    if (rttEl) rttEl.textContent = `${this.data.rttMs} ms`;

    const d3El = this.leftContainer.querySelector('#hud-d3');
    if (d3El) d3El.textContent = `${this.data.d3LatencyMs} ms`;

    const ttsEl = this.leftContainer.querySelector('#hud-tts');
    if (ttsEl) ttsEl.textContent = `${this.data.ttsLatencyMs} ms`;

    const meterBar = this.leftContainer.querySelector('#hud-meter-bar') as HTMLElement;
    if (meterBar) {
      const pct = Math.min(100, Math.round(this.data.visemeEnergy * 100));
      meterBar.style.width = `${pct}%`;
    }

    // Right HUD elements
    const voiceStateEl = this.rightContainer.querySelector('#hud-voice-state');
    if (voiceStateEl) {
      voiceStateEl.textContent = this.data.speechState;
      voiceStateEl.className = `holo-badge holo-badge-${this.data.speechState.toLowerCase()}`;
    }

    const intentEl = this.rightContainer.querySelector('#hud-intent');
    if (intentEl) intentEl.textContent = this.data.intentClass.slice(0, 18);

    const emotionEl = this.rightContainer.querySelector('#hud-emotion');
    if (emotionEl) emotionEl.textContent = this.data.emotion;

    const shaderEl = this.rightContainer.querySelector('#hud-shader');
    if (shaderEl) shaderEl.textContent = this.data.shaderState;
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (this.leftContainer) this.leftContainer.style.display = visible ? 'block' : 'none';
    if (this.rightContainer) this.rightContainer.style.display = visible ? 'block' : 'none';
  }

  public getData(): TelemetryData {
    return { ...this.data };
  }
}
