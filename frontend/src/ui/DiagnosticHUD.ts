export class DiagnosticHUD {
  private container: HTMLElement;
  private fpsEl: HTMLElement | null = null;
  private rttEl: HTMLElement | null = null;
  private bufferEl: HTMLElement | null = null;
  private visemeEl: HTMLElement | null = null;

  private frameCount: number = 0;
  private lastFpsUpdateTime: number = performance.now();

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    const el = document.createElement('div');
    el.className = 'hud-section';
    el.style.borderTop = '1px solid rgba(0, 229, 255, 0.2)';
    el.style.paddingTop = '10px';
    el.style.marginTop = '10px';
    el.style.fontSize = '11px';

    el.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 6px;">TELEMETRY & HARDWARE</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: rgba(0, 229, 255, 0.8);">
        <div>FPS: <span id="diag-fps" style="color: #00ff88;">60</span></div>
        <div>RTT: <span id="diag-rtt">18ms</span></div>
        <div>Buffer: <span id="diag-buf">60ms</span></div>
        <div>Viseme: <span id="diag-vis" style="color: #ffbb00;">sil</span></div>
      </div>
    `;

    this.container.appendChild(el);
    this.fpsEl = el.querySelector('#diag-fps');
    this.rttEl = el.querySelector('#diag-rtt');
    this.bufferEl = el.querySelector('#diag-buf');
    this.visemeEl = el.querySelector('#diag-vis');
  }

  public recordFrame(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdateTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      if (this.fpsEl) {
        this.fpsEl.textContent = `${fps}`;
        this.fpsEl.style.color = fps >= 55 ? '#00ff88' : '#ff2244';
      }
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
    }
  }

  public updateBuffer(durationMs: number): void {
    if (this.bufferEl) this.bufferEl.textContent = `${Math.round(durationMs)}ms`;
  }

  public updateViseme(viseme: string): void {
    if (this.visemeEl) this.visemeEl.textContent = viseme.replace('viseme_', '');
  }

  public updateRTT(rttMs: number): void {
    if (this.rttEl) this.rttEl.textContent = `${Math.round(rttMs)}ms`;
  }
}
