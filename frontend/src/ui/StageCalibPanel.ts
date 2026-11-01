import { ICONS } from './HoloIcons';

export interface StageCalibSettings {
  baseWidthMm: number;
  baseHeightMm: number;
  glassAngleDeg: number;
  hypotenuseMm: number;
  flipX: boolean;
  flipY: boolean;
  fovDeg: number;
  compensatedFovDeg: number;
  fresnelBias: number;
  fresnelPower: number;
  scanlineIntensity: number;
  glitchIntensity: number;
  ipsMode: boolean;
  ipsExposure: number;
  ipsRimBoost: number;
}

export interface StageCalibCallbacks {
  onChange?: (settings: StageCalibSettings) => void;
  onReset?: () => void;
  onFullscreenToggle?: () => void;
  onIPSOptimizationChange?: (enabled: boolean, exposure: number, rimBoost: number) => void;
}

export class StageCalibPanel {
  public container: HTMLElement | null = null;
  private isVisible: boolean = false;
  private settings: StageCalibSettings = {
    baseWidthMm: 345, // Standard 15.6" screen width
    baseHeightMm: 345, // 1:1 Pythagorean triangle base/height
    glassAngleDeg: 45.0,
    hypotenuseMm: 487.9,
    flipX: false,
    flipY: false,
    fovDeg: 45.0,
    compensatedFovDeg: 33.1,
    fresnelBias: 0.1,
    fresnelPower: 2.5,
    scanlineIntensity: 0.35,
    glitchIntensity: 0.0,
    ipsMode: true,
    ipsExposure: 1.45,
    ipsRimBoost: 4.5
  };

  private callbacks: StageCalibCallbacks;

  constructor(callbacks: StageCalibCallbacks = {}) {
    this.callbacks = callbacks;
    this.recomputePythagoras();
    if (typeof document !== 'undefined') {
      this.buildDOM();
    }
  }

  public recomputePythagoras(): void {
    const B = this.settings.baseWidthMm;
    const H = this.settings.baseHeightMm;
    this.settings.hypotenuseMm = Math.round(Math.sqrt(B * B + H * H) * 10) / 10;
    this.settings.glassAngleDeg = Math.round(Math.atan2(H, B) * (180 / Math.PI) * 10) / 10;

    // Compensate FOV: FOV_comp = 2 * atan(tan(FOV_0 / 2) * cos(theta))
    const radFov = (this.settings.fovDeg * Math.PI) / 180;
    const radTheta = (this.settings.glassAngleDeg * Math.PI) / 180;
    const compRad = 2 * Math.atan(Math.tan(radFov / 2) * Math.cos(radTheta));
    this.settings.compensatedFovDeg = Math.round((compRad * 180) / Math.PI * 10) / 10;
  }

  private buildDOM(): void {
    const el = document.createElement('div');
    el.id = 'stage-calib-panel';
    el.className = 'holo-drawer stage-calib-closed';
    el.innerHTML = `
      <div class="holo-drawer-header">
        <h3>${ICONS.sliders} PEPPER'S GHOST STAGE CALIBRATOR</h3>
        <button id="btn-close-calib" class="holo-btn-icon" title="Close">${ICONS.close}</button>
      </div>

      <div class="holo-drawer-body">
        <!-- Fullscreen Projection Action -->
        <div class="holo-section">
          <div class="holo-section-title">
            <span>OPTICAL FULLSCREEN PROJECTION</span>
            <span class="holo-badge holo-badge-listening">ZERO UI BLEED</span>
          </div>
          <p style="font-size:10px; color:#71717a; margin-bottom:8px; line-height:1.4;">
            Removes all browser bars, HUDs and buttons. Leaves only the 3D hologram on pure black for reflection.
          </p>
          <button id="btn-calib-fullscreen" class="holo-btn holo-btn-cyan" style="width:100%; justify-content:center; padding:8px 12px;">
            ${ICONS.maximize} ENTER FULLSCREEN PROJECTION MODE
          </button>
        </div>

        <!-- IPS Display Optimization -->
        <div class="holo-section">
          <div class="holo-section-title">
            <span>IPS PANEL DISPLAY & MAX BRIGHTNESS</span>
            <span class="holo-badge holo-badge-cyan">ANTI-GLOW</span>
          </div>
          <div class="holo-toggle-row">
            <label><input type="checkbox" id="chk-ips-mode" ${this.settings.ipsMode ? 'checked' : ''} /> Enable IPS High-Contrast Mode</label>
          </div>
          <div class="holo-slider-group" style="margin-top:10px;">
            <label>Max Luminescence Exposure: <span id="lbl-val-ips-exposure">${this.settings.ipsExposure}x</span></label>
            <input type="range" id="slider-ips-exposure" min="0.8" max="2.5" step="0.05" value="${this.settings.ipsExposure}" class="holo-slider" />
          </div>
          <div class="holo-slider-group" style="margin-top:8px;">
            <label>High-Intensity Key Rim Light: <span id="lbl-val-ips-rim">${this.settings.ipsRimBoost}</span></label>
            <input type="range" id="slider-ips-rim" min="1.5" max="6.5" step="0.2" value="${this.settings.ipsRimBoost}" class="holo-slider" />
          </div>
        </div>

        <!-- Physical Dimensions -->
        <div class="holo-section">
          <div class="holo-section-title">PYTHAGOREAN OPTICAL GEOMETRY</div>
          <div class="holo-slider-group">
            <label>Base Width B (mm): <span id="lbl-val-width">${this.settings.baseWidthMm}mm</span></label>
            <input type="range" id="slider-base-width" min="100" max="1200" value="${this.settings.baseWidthMm}" class="holo-slider" />
          </div>
          <div class="holo-slider-group">
            <label>Stage Height H (mm): <span id="lbl-val-height">${this.settings.baseHeightMm}mm</span></label>
            <input type="range" id="slider-base-height" min="100" max="1200" value="${this.settings.baseHeightMm}" class="holo-slider" />
          </div>
          <div class="holo-stat-card" style="margin-top:8px;">
            <div>Reflector Hypotenuse C: <strong id="lbl-val-hypot">${this.settings.hypotenuseMm} mm</strong></div>
            <div>Reflector Tilt Angle θ: <strong id="lbl-val-angle">${this.settings.glassAngleDeg}°</strong></div>
            <div>Compensated FOV: <strong id="lbl-val-fov">${this.settings.compensatedFovDeg}°</strong></div>
          </div>
        </div>

        <!-- Optical Flip & Inversion -->
        <div class="holo-section">
          <div class="holo-section-title">OPTICAL REFLECTION TRANSFORM</div>
          <div class="holo-toggle-row">
            <label><input type="checkbox" id="chk-calib-flip-x" ${this.settings.flipX ? 'checked' : ''} /> Flip Horizontal (ScaleX -1)</label>
            <label><input type="checkbox" id="chk-calib-flip-y" ${this.settings.flipY ? 'checked' : ''} /> Flip Vertical (ScaleY -1)</label>
          </div>
        </div>

        <!-- Presets -->
        <div class="holo-section">
          <div class="holo-section-title">STAGE PRESETS</div>
          <div class="holo-btn-grid">
            <button class="holo-btn holo-btn-secondary" data-preset="15inch">15.6" Desktop (45°)</button>
            <button class="holo-btn holo-btn-secondary" data-preset="tablet">11" Tablet (45°)</button>
            <button class="holo-btn holo-btn-secondary" data-preset="27inch">27" Showcase (45°)</button>
            <button class="holo-btn holo-btn-secondary" data-preset="direct">Direct 3D (0°)</button>
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

    const btnClose = this.container.querySelector('#btn-close-calib');
    btnClose?.addEventListener('click', () => this.toggle(false));

    // Fullscreen button
    const btnFs = this.container.querySelector('#btn-calib-fullscreen');
    btnFs?.addEventListener('click', () => {
      this.callbacks.onFullscreenToggle?.();
    });

    // IPS Controls
    const chkIPS = this.container.querySelector('#chk-ips-mode') as HTMLInputElement;
    const sliderExposure = this.container.querySelector('#slider-ips-exposure') as HTMLInputElement;
    const sliderRim = this.container.querySelector('#slider-ips-rim') as HTMLInputElement;
    const lblExp = this.container.querySelector('#lbl-val-ips-exposure');
    const lblRim = this.container.querySelector('#lbl-val-ips-rim');

    const updateIPS = () => {
      this.settings.ipsMode = chkIPS.checked;
      this.settings.ipsExposure = parseFloat(sliderExposure.value);
      this.settings.ipsRimBoost = parseFloat(sliderRim.value);

      if (lblExp) lblExp.textContent = `${this.settings.ipsExposure.toFixed(2)}x`;
      if (lblRim) lblRim.textContent = `${this.settings.ipsRimBoost.toFixed(1)}`;

      this.callbacks.onIPSOptimizationChange?.(
        this.settings.ipsMode,
        this.settings.ipsExposure,
        this.settings.ipsRimBoost
      );
      this.callbacks.onChange?.(this.settings);
    };

    chkIPS?.addEventListener('change', updateIPS);
    sliderExposure?.addEventListener('input', updateIPS);
    sliderRim?.addEventListener('input', updateIPS);

    // Width & Height sliders
    const sliderW = this.container.querySelector('#slider-base-width') as HTMLInputElement;
    const sliderH = this.container.querySelector('#slider-base-height') as HTMLInputElement;
    const lblW = this.container.querySelector('#lbl-val-width');
    const lblH = this.container.querySelector('#lbl-val-height');
    const lblHyp = this.container.querySelector('#lbl-val-hypot');
    const lblAng = this.container.querySelector('#lbl-val-angle');
    const lblFov = this.container.querySelector('#lbl-val-fov');

    const updateGeometry = () => {
      this.settings.baseWidthMm = parseFloat(sliderW.value);
      this.settings.baseHeightMm = parseFloat(sliderH.value);
      this.recomputePythagoras();

      if (lblW) lblW.textContent = `${this.settings.baseWidthMm}mm`;
      if (lblH) lblH.textContent = `${this.settings.baseHeightMm}mm`;
      if (lblHyp) lblHyp.textContent = `${this.settings.hypotenuseMm} mm`;
      if (lblAng) lblAng.textContent = `${this.settings.glassAngleDeg}°`;
      if (lblFov) lblFov.textContent = `${this.settings.compensatedFovDeg}°`;

      this.callbacks.onChange?.(this.settings);
    };

    sliderW?.addEventListener('input', updateGeometry);
    sliderH?.addEventListener('input', updateGeometry);

    // Flips
    const chkX = this.container.querySelector('#chk-calib-flip-x') as HTMLInputElement;
    const chkY = this.container.querySelector('#chk-calib-flip-y') as HTMLInputElement;

    chkX?.addEventListener('change', () => {
      this.settings.flipX = chkX.checked;
      this.callbacks.onChange?.(this.settings);
    });
    chkY?.addEventListener('change', () => {
      this.settings.flipY = chkY.checked;
      this.callbacks.onChange?.(this.settings);
    });

    // Presets
    const presetButtons = this.container.querySelectorAll('[data-preset]');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', (e: any) => {
        const p = e.target.getAttribute('data-preset');
        if (p === '15inch') {
          sliderW.value = '345';
          sliderH.value = '345';
        } else if (p === 'tablet') {
          sliderW.value = '240';
          sliderH.value = '240';
        } else if (p === '27inch') {
          sliderW.value = '600';
          sliderH.value = '600';
        } else if (p === 'direct') {
          sliderW.value = '345';
          sliderH.value = '0';
        }
        updateGeometry();
      });
    });
  }

  public toggle(force?: boolean): void {
    this.isVisible = force !== undefined ? force : !this.isVisible;
    if (this.container) {
      this.container.classList.toggle('stage-calib-closed', !this.isVisible);
      this.container.classList.toggle('stage-calib-open', this.isVisible);
    }
  }

  public getSettings(): StageCalibSettings {
    return { ...this.settings };
  }

  public setSettings(s: Partial<StageCalibSettings>): void {
    this.settings = { ...this.settings, ...s };
    this.recomputePythagoras();
    this.callbacks.onChange?.(this.settings);
  }
}
