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
}

export interface StageCalibCallbacks {
  onChange?: (settings: StageCalibSettings) => void;
  onReset?: () => void;
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
    glitchIntensity: 0.0
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
        <h3>◈ PEPPER'S GHOST STAGE CALIBRATOR</h3>
        <button id="btn-close-calib" class="holo-btn-icon">✕</button>
      </div>

      <div class="holo-drawer-body">
        <!-- Physical Dimensions -->
        <div class="holo-section">
          <label class="holo-section-title">PYTHAGOREAN OPTICAL GEOMETRY</label>
          <div class="holo-slider-group">
            <label>Base Width B (mm): <span id="lbl-val-width">${this.settings.baseWidthMm}mm</span></label>
            <input type="range" id="slider-base-width" min="100" max="1200" value="${this.settings.baseWidthMm}" class="holo-slider" />
          </div>
          <div class="holo-slider-group">
            <label>Stage Height H (mm): <span id="lbl-val-height">${this.settings.baseHeightMm}mm</span></label>
            <input type="range" id="slider-base-height" min="100" max="1200" value="${this.settings.baseHeightMm}" class="holo-slider" />
          </div>
          <div class="holo-stat-box">
            <div>Reflector Hypotenuse C: <strong id="lbl-val-hypot">${this.settings.hypotenuseMm} mm</strong></div>
            <div>Reflector Tilt Angle θ: <strong id="lbl-val-angle">${this.settings.glassAngleDeg}°</strong></div>
            <div>Compensated FOV: <strong id="lbl-val-fov">${this.settings.compensatedFovDeg}°</strong></div>
          </div>
        </div>

        <!-- Optical Flip & Inversion -->
        <div class="holo-section">
          <label class="holo-section-title">OPTICAL REFLECTION TRANSFORM</label>
          <div class="holo-toggle-row">
            <label><input type="checkbox" id="chk-calib-flip-x" /> Flip Horizontal (ScaleX -1)</label>
            <label><input type="checkbox" id="chk-calib-flip-y" /> Flip Vertical (ScaleY -1)</label>
          </div>
        </div>

        <!-- Hologram Shader Settings -->
        <div class="holo-section">
          <label class="holo-section-title">HOLOGRAPHIC SHADER UNIFORMS</label>
          <div class="holo-slider-group">
            <label>Fresnel Rim Power: <span id="lbl-val-fresnel">${this.settings.fresnelPower}</span></label>
            <input type="range" id="slider-fresnel-power" min="0.5" max="5.0" step="0.1" value="${this.settings.fresnelPower}" class="holo-slider" />
          </div>
          <div class="holo-slider-group">
            <label>Scanline Intensity: <span id="lbl-val-scanlines">${this.settings.scanlineIntensity}</span></label>
            <input type="range" id="slider-scanlines" min="0" max="1.0" step="0.05" value="${this.settings.scanlineIntensity}" class="holo-slider" />
          </div>
          <div class="holo-slider-group">
            <label>Glitch Noise: <span id="lbl-val-glitch">${this.settings.glitchIntensity}</span></label>
            <input type="range" id="slider-glitch" min="0" max="1.0" step="0.05" value="${this.settings.glitchIntensity}" class="holo-slider" />
          </div>
        </div>

        <!-- Presets -->
        <div class="holo-section">
          <label class="holo-section-title">STAGE PRESETS</label>
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

    // Shaders
    const sliderFresnel = this.container.querySelector('#slider-fresnel-power') as HTMLInputElement;
    const sliderScan = this.container.querySelector('#slider-scanlines') as HTMLInputElement;
    const sliderGlitch = this.container.querySelector('#slider-glitch') as HTMLInputElement;

    sliderFresnel?.addEventListener('input', () => {
      this.settings.fresnelPower = parseFloat(sliderFresnel.value);
      const lbl = this.container?.querySelector('#lbl-val-fresnel');
      if (lbl) lbl.textContent = `${this.settings.fresnelPower}`;
      this.callbacks.onChange?.(this.settings);
    });

    sliderScan?.addEventListener('input', () => {
      this.settings.scanlineIntensity = parseFloat(sliderScan.value);
      const lbl = this.container?.querySelector('#lbl-val-scanlines');
      if (lbl) lbl.textContent = `${this.settings.scanlineIntensity}`;
      this.callbacks.onChange?.(this.settings);
    });

    sliderGlitch?.addEventListener('input', () => {
      this.settings.glitchIntensity = parseFloat(sliderGlitch.value);
      const lbl = this.container?.querySelector('#lbl-val-glitch');
      if (lbl) lbl.textContent = `${this.settings.glitchIntensity}`;
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
      if (this.isVisible) {
        this.container.classList.remove('stage-calib-closed');
        this.container.classList.add('stage-calib-open');
      } else {
        this.container.classList.remove('stage-calib-open');
        this.container.classList.add('stage-calib-closed');
      }
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
