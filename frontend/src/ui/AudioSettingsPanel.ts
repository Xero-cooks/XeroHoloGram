export class AudioSettingsPanel {
  private container: HTMLElement;
  private vuMeterEl: HTMLElement | null = null;
  private onMuteToggleCallback?: (muted: boolean) => void;
  private onTtsChangeCallback?: (engine: string) => void;
  private isMuted: boolean = false;

  constructor(
    container: HTMLElement,
    callbacks?: {
      onMuteToggle?: (muted: boolean) => void;
      onTtsChange?: (engine: string) => void;
    }
  ) {
    this.container = container;
    this.onMuteToggleCallback = callbacks?.onMuteToggle;
    this.onTtsChangeCallback = callbacks?.onTtsChange;
    this.render();
  }

  private render(): void {
    const el = document.createElement('div');
    el.className = 'hud-section';
    el.style.borderTop = '1px solid rgba(0, 229, 255, 0.2)';
    el.style.paddingTop = '10px';
    el.style.marginTop = '10px';

    el.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">VOICE & ACOUSTIC PIPELINE</div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px;">TTS Engine:</span>
        <select id="tts-engine-select" class="control-select" style="width: 140px;">
          <option value="Edge-TTS" selected>Edge-TTS (Neural)</option>
          <option value="Kokoro-82M">Kokoro-82M (Open)</option>
          <option value="ElevenLabs">ElevenLabs (Stream)</option>
          <option value="Cartesia">Cartesia Sonic</option>
          <option value="OpenAI-TTS">OpenAI TTS-1</option>
          <option value="Piper">Piper (Local)</option>
        </select>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button id="mic-mute-btn" style="background: rgba(0, 40, 70, 0.7); border: 1px solid #00e5ff; color: #00e5ff; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer;">
          Mic: Live
        </button>
        <div style="flex: 1; height: 12px; background: rgba(0, 20, 35, 0.8); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 3px; overflow: hidden;">
          <div id="mic-vu-bar" style="width: 0%; height: 100%; background: #00e5ff; transition: width 0.05s ease-out;"></div>
        </div>
      </div>
    `;

    this.container.appendChild(el);
    this.vuMeterEl = el.querySelector('#mic-vu-bar');

    const select = el.querySelector('#tts-engine-select') as HTMLSelectElement;
    select.addEventListener('change', () => this.onTtsChangeCallback?.(select.value));

    const muteBtn = el.querySelector('#mic-mute-btn') as HTMLButtonElement;
    muteBtn.addEventListener('click', () => {
      this.isMuted = !this.isMuted;
      muteBtn.textContent = this.isMuted ? 'Mic: Muted' : 'Mic: Live';
      muteBtn.style.color = this.isMuted ? '#ff2244' : '#00e5ff';
      muteBtn.style.borderColor = this.isMuted ? '#ff2244' : '#00e5ff';
      this.onMuteToggleCallback?.(this.isMuted);
    });
  }

  public updateVUMeter(rms: number): void {
    if (this.vuMeterEl && !this.isMuted) {
      const pct = Math.min(Math.round(rms * 400), 100);
      this.vuMeterEl.style.width = `${pct}%`;
    }
  }
}
