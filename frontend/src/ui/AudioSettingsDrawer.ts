import { ICONS } from './HoloIcons';

export interface AudioSettingsData {
  deviceId: string;
  energyThreshold: number;
  hangoverMs: number;
  silenceEndpointMs: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  language: string;
}

export interface AudioSettingsDrawerCallbacks {
  onRequestPermission?: () => Promise<boolean>;
  onDeviceSelect?: (deviceId: string) => void;
  onSettingsChange?: (settings: AudioSettingsData) => void;
}

export class AudioSettingsDrawer {
  public container: HTMLElement | null = null;
  private isOpen: boolean = false;
  private callbacks: AudioSettingsDrawerCallbacks;

  private settings: AudioSettingsData = {
    deviceId: 'default',
    energyThreshold: 0.03,
    hangoverMs: 350,
    silenceEndpointMs: 750,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    language: 'en-US'
  };

  private availableDevices: MediaDeviceInfo[] = [];

  constructor(callbacks: AudioSettingsDrawerCallbacks = {}) {
    this.callbacks = callbacks;
    if (typeof document !== 'undefined') {
      this.buildDOM();
    }
  }

  private buildDOM(): void {
    const el = document.createElement('div');
    el.id = 'audio-settings-drawer';
    el.className = 'holo-drawer rig-studio-closed';
    el.style.left = '14px';
    el.style.right = 'auto';
    el.style.zIndex = '210';
    el.innerHTML = `
      <div class="holo-drawer-header">
        <h3>${ICONS.mic} MICROPHONE & AUDIO SENSOR</h3>
        <button id="btn-close-audio-settings" class="holo-btn-icon" title="Close">${ICONS.close}</button>
      </div>

      <div class="holo-drawer-body">
        <!-- Permission & Live Test -->
        <div class="holo-section">
          <div class="holo-section-title">
            <span>MIC ACCESS & PERMISSIONS</span>
            <span id="badge-mic-perm" class="holo-badge holo-badge-idle">STANDBY</span>
          </div>

          <button id="btn-request-mic-perm" class="holo-btn holo-btn-cyan" style="width:100%; justify-content:center; padding:8px 12px;">
            ${ICONS.mic} GRANT MIC PERMISSION & SCAN DEVICES
          </button>

          <!-- Live Input Meter -->
          <div style="margin-top:14px;">
            <div style="display:flex; justify-content:space-between; font-size:10.5px; margin-bottom:4px;">
              <span>LIVE MIC VOLUME (RMS):</span>
              <strong id="lbl-mic-rms" class="holo-val-cyan">0%</strong>
            </div>
            <div class="holo-meter" style="width:100%; height:10px; background:rgba(0,0,0,0.5);">
              <div id="mic-vu-bar" class="holo-meter-fill" style="width:0%;"></div>
            </div>
          </div>
        </div>

        <!-- Hardware Device Selection -->
        <div class="holo-section">
          <div class="holo-section-title">
            <span>AUDIO INPUT HARDWARE</span>
          </div>
          
          <div class="holo-slider-group">
            <label>Select Microphone:</label>
            <select id="select-audio-input-device" class="holo-select" style="width:100%; max-width:none; padding:8px;">
              <option value="default">Default System Microphone</option>
            </select>
          </div>
        </div>

        <!-- VAD & DSP Tuning -->
        <div class="holo-section">
          <div class="holo-section-title">
            <span>VAD SENSITIVITY & DSP FILTERS</span>
          </div>

          <div class="holo-slider-group">
            <label>Voice Energy Threshold: <span id="lbl-val-vad-thresh">${this.settings.energyThreshold}</span></label>
            <input type="range" id="slider-vad-thresh" min="0.01" max="0.15" step="0.005" value="${this.settings.energyThreshold}" class="holo-slider" />
          </div>

          <div class="holo-slider-group" style="margin-top:10px;">
            <label>Speech Hangover (ms): <span id="lbl-val-hangover">${this.settings.hangoverMs} ms</span></label>
            <input type="range" id="slider-vad-hangover" min="100" max="600" step="25" value="${this.settings.hangoverMs}" class="holo-slider" />
          </div>

          <div class="holo-slider-group" style="margin-top:10px;">
            <label>Silence Endpoint (ms): <span id="lbl-val-endpoint">${this.settings.silenceEndpointMs} ms</span></label>
            <input type="range" id="slider-vad-endpoint" min="300" max="1500" step="50" value="${this.settings.silenceEndpointMs}" class="holo-slider" />
          </div>

          <div class="holo-toggle-row" style="margin-top:14px; gap:16px;">
            <label><input type="checkbox" id="chk-echo" checked /> Echo Cancellation</label>
            <label><input type="checkbox" id="chk-noise" checked /> Noise Suppression</label>
            <label><input type="checkbox" id="chk-gain" checked /> Auto Gain</label>
          </div>
        </div>

        <!-- Recognition Language -->
        <div class="holo-section">
          <div class="holo-section-title">
            <span>STT SPEECH RECOGNITION LANGUAGE</span>
          </div>

          <div class="holo-slider-group">
            <select id="select-stt-lang" class="holo-select" style="width:100%; max-width:none; padding:8px;">
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
              <option value="es-ES">Spanish (Español)</option>
              <option value="fr-FR">French (Français)</option>
              <option value="de-DE">German (Deutsch)</option>
              <option value="ja-JP">Japanese (日本語)</option>
              <option value="zh-CN">Chinese (Mandarin 简体中文)</option>
              <option value="hi-IN">Hindi (हिन्दी)</option>
            </select>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    this.container = el;
    this.wireEvents();
  }

  private wireEvents(): void {
    if (!this.container) return;

    // Close button
    const btnClose = this.container.querySelector('#btn-close-audio-settings');
    btnClose?.addEventListener('click', () => this.toggle(false));

    // Request Permission button
    const btnPerm = this.container.querySelector('#btn-request-mic-perm');
    const badgePerm = this.container.querySelector('#badge-mic-perm');

    btnPerm?.addEventListener('click', async () => {
      if (this.callbacks.onRequestPermission) {
        const ok = await this.callbacks.onRequestPermission();
        if (badgePerm) {
          badgePerm.textContent = ok ? 'ACTIVE' : 'DENIED';
          badgePerm.className = ok ? 'holo-badge holo-badge-listening' : 'holo-badge holo-badge-interrupted';
        }
        if (ok) {
          await this.enumerateAudioDevices();
        }
      }
    });

    // Device selector
    const selectDevice = this.container.querySelector('#select-audio-input-device') as HTMLSelectElement;
    selectDevice?.addEventListener('change', () => {
      this.settings.deviceId = selectDevice.value;
      this.callbacks.onDeviceSelect?.(this.settings.deviceId);
      this.notifyChange();
    });

    // VAD Slider
    const sliderVAD = this.container.querySelector('#slider-vad-thresh') as HTMLInputElement;
    const lblVAD = this.container.querySelector('#lbl-val-vad-thresh');
    sliderVAD?.addEventListener('input', () => {
      this.settings.energyThreshold = parseFloat(sliderVAD.value);
      if (lblVAD) lblVAD.textContent = sliderVAD.value;
      this.notifyChange();
    });

    // Hangover Slider
    const sliderHang = this.container.querySelector('#slider-vad-hangover') as HTMLInputElement;
    const lblHang = this.container.querySelector('#lbl-val-hangover');
    sliderHang?.addEventListener('input', () => {
      this.settings.hangoverMs = parseInt(sliderHang.value, 10);
      if (lblHang) lblHang.textContent = `${sliderHang.value} ms`;
      this.notifyChange();
    });

    // Endpoint Slider
    const sliderEndpoint = this.container.querySelector('#slider-vad-endpoint') as HTMLInputElement;
    const lblEndpoint = this.container.querySelector('#lbl-val-endpoint');
    sliderEndpoint?.addEventListener('input', () => {
      this.settings.silenceEndpointMs = parseInt(sliderEndpoint.value, 10);
      if (lblEndpoint) lblEndpoint.textContent = `${sliderEndpoint.value} ms`;
      this.notifyChange();
    });

    // Checkboxes
    const chkEcho = this.container.querySelector('#chk-echo') as HTMLInputElement;
    const chkNoise = this.container.querySelector('#chk-noise') as HTMLInputElement;
    const chkGain = this.container.querySelector('#chk-gain') as HTMLInputElement;

    [chkEcho, chkNoise, chkGain].forEach(chk => {
      chk?.addEventListener('change', () => {
        this.settings.echoCancellation = chkEcho.checked;
        this.settings.noiseSuppression = chkNoise.checked;
        this.settings.autoGainControl = chkGain.checked;
        this.notifyChange();
      });
    });

    // Language selector
    const selectLang = this.container.querySelector('#select-stt-lang') as HTMLSelectElement;
    selectLang?.addEventListener('change', () => {
      this.settings.language = selectLang.value;
      this.notifyChange();
    });
  }

  public async enumerateAudioDevices(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter(d => d.kind === 'audioinput');

      const selectDevice = this.container?.querySelector('#select-audio-input-device') as HTMLSelectElement;
      if (selectDevice) {
        selectDevice.innerHTML = '';
        if (this.availableDevices.length === 0) {
          selectDevice.innerHTML = '<option value="default">Default System Microphone</option>';
        } else {
          this.availableDevices.forEach((d, idx) => {
            const opt = document.createElement('option');
            opt.value = d.deviceId;
            opt.textContent = d.label || `Microphone ${idx + 1}`;
            selectDevice.appendChild(opt);
          });
        }
      }
    } catch (e) {
      console.warn('[AudioSettingsDrawer] Error enumerating devices:', e);
    }
  }

  public updateVUMeter(rms: number): void {
    if (!this.container) return;
    const bar = this.container.querySelector('#mic-vu-bar') as HTMLElement;
    const lbl = this.container.querySelector('#lbl-mic-rms');
    const pct = Math.min(100, Math.round(rms * 250));
    if (bar) bar.style.width = `${pct}%`;
    if (lbl) lbl.textContent = `${pct}%`;
  }

  private notifyChange(): void {
    this.callbacks.onSettingsChange?.({ ...this.settings });
  }

  public toggle(force?: boolean): void {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    if (this.container) {
      this.container.classList.toggle('rig-studio-closed', !this.isOpen);
      this.container.classList.toggle('rig-studio-open', this.isOpen);
    }
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public getSettings(): AudioSettingsData {
    return { ...this.settings };
  }
}
