import { Joint28 } from '../rig/CanonicalSkeleton';
import { RigProfile } from '../rig/RigCalibrator';
import { LoadedRiggedModel, UniversalModelLoader } from '../rig/UniversalModelLoader';
import { ICONS } from './HoloIcons';

export interface RigStudioDrawerCallbacks {
  onBoneSelect?: (boneName: string) => void;
  onJointMapChange?: (canonicalJoint: Joint28, mappedBoneName: string) => void;
  onAxisInvertToggle?: (axis: 'invert_x' | 'invert_y' | 'invert_z', value: boolean) => void;
  onTestAngleChange?: (boneName: string, eulerDeg: [number, number, number]) => void;
  onExportConfig?: (config: RigProfile) => void;
  onImportConfig?: (config: RigProfile) => void;
  onModelLoaded?: (model: LoadedRiggedModel) => void;
  onResetToDefaultRig?: () => void;
  onModelTransformChange?: (scale: number, offsetY: number, rotYDeg: number) => void;
  onShaderPaletteChange?: (colorHex: number) => void;
  onParticleIntensityChange?: (opacity: number) => void;
}

export class RigStudioDrawer {
  public container: HTMLElement | null = null;
  private isOpen: boolean = false;
  private currentTab: 'model' | 'bones' | 'fx' = 'model';
  private currentBoneName: string = '';
  private currentMapping: Record<string, string> = {};
  private detectedBones: string[] = [];
  private callbacks: RigStudioDrawerCallbacks;

  // Active Model Stats
  private activeModelName: string = 'XeroKratos (Default Procedural)';
  private isCustomModel: boolean = false;
  private modelScale: number = 1.0;
  private modelOffsetY: number = 0.0;
  private modelRotYDeg: number = 0.0;

  // Calibration state
  private axisInversions = {
    invert_x: false,
    invert_y: false,
    invert_z: false
  };
  private testAngles: [number, number, number] = [0, 0, 0];

  constructor(callbacks: RigStudioDrawerCallbacks = {}) {
    this.callbacks = callbacks;
    if (typeof document !== 'undefined') {
      this.buildDOM();
    }
  }

  private buildDOM(): void {
    const el = document.createElement('div');
    el.id = 'rig-studio-drawer';
    el.className = 'holo-drawer rig-studio-closed';
    el.innerHTML = `
      <div class="holo-drawer-header">
        <h3>${ICONS.box} 3D AVATAR & RIG CONFIGURATION</h3>
        <button id="btn-close-rig-studio" class="holo-btn-icon" title="Close">${ICONS.close}</button>
      </div>

      <!-- Tab Navigation -->
      <div class="holo-tabs">
        <div class="holo-tab active" data-tab="model">${ICONS.box} 3D MODEL</div>
        <div class="holo-tab" data-tab="bones">${ICONS.bones} BONE STUDIO</div>
        <div class="holo-tab" data-tab="fx">${ICONS.palette} SHADERS & FX</div>
      </div>

      <div class="holo-drawer-body">
        <!-- ================= TAB 1: 3D MODEL INGESTION ================= -->
        <div id="tab-content-model" class="tab-pane">
          <div class="holo-section">
            <div class="holo-section-title">
              <span>INGEST CUSTOM 3D CHARACTER</span>
              <span class="holo-badge holo-badge-cyan">MULTI-FORMAT</span>
            </div>
            
            <div id="rig-dropzone" class="holo-dropzone">
              <div class="holo-dropzone-icon" style="margin-bottom:6px;">${ICONS.box}</div>
              <span>DRAG & DROP 3D MODEL HERE</span>
              <small style="display:block; margin-top:4px; color:#71717a;">.GLB  •  .GLTF  •  .VRM  •  .OBJ</small>
              <input type="file" id="rig-file-input" accept=".glb,.gltf,.vrm,.obj" style="display:none" />
              <button id="btn-browse-rig" class="holo-btn holo-btn-cyan" style="margin-top:8px;">
                ${ICONS.box} CHOOSE LOCAL FILE
              </button>
            </div>

            <!-- Active Model Card -->
            <div class="holo-stat-card" style="margin-top: 12px; background:#08080a; border:1px solid var(--holo-border); padding:10px; border-radius:2px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span id="lbl-active-model-title" style="font-weight:700; font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase; color:#fff;">ACTIVE MODEL</span>
                <span id="badge-model-status" class="holo-badge holo-badge-listening">BUILT-IN RIG</span>
              </div>
              <strong id="lbl-active-model-name" style="display:block; margin: 4px 0 8px 0; font-size:11px; font-family:var(--holo-font-mono);">XeroKratos Cybernetic Orchestrator</strong>
              
              <div class="holo-stat-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <div class="holo-stat-card" style="background:#0d0d0f; padding:6px; border:1px solid rgba(255,255,255,0.06); border-radius:2px;">
                  <span style="font-size:9px; color:#71717a; font-weight:700; text-transform:uppercase; display:block;">TRIANGLES</span>
                  <strong id="stat-triangles" style="font-family:var(--holo-font-mono); font-size:11px;">1,840</strong>
                </div>
                <div class="holo-stat-card" style="background:#0d0d0f; padding:6px; border:1px solid rgba(255,255,255,0.06); border-radius:2px;">
                  <span style="font-size:9px; color:#71717a; font-weight:700; text-transform:uppercase; display:block;">CANONICAL BONES</span>
                  <strong id="stat-bones" style="font-family:var(--holo-font-mono); font-size:11px;">28 / 28</strong>
                </div>
              </div>

              <div style="margin-top:8px; display:flex; gap:6px;">
                <button id="btn-reset-default-rig" class="holo-btn holo-btn-secondary" style="width:100%; justify-content:center;">
                  ${ICONS.refresh} RESTORE DEFAULT XEROKRATOS
                </button>
              </div>
            </div>
          </div>

          <!-- Model Live Transform Controls -->
          <div class="holo-section">
            <div class="holo-section-title">
              <span>HOLOGRAM STAGE PLACEMENT</span>
            </div>
            <div class="holo-slider-group">
              <label>Model Scale: <span id="lbl-val-scale">1.0x</span></label>
              <input type="range" id="slider-model-scale" min="0.2" max="3.0" step="0.05" value="1.0" class="holo-slider" />
            </div>
            <div class="holo-slider-group">
              <label>Vertical Y Elevation: <span id="lbl-val-offset-y">0.00m</span></label>
              <input type="range" id="slider-model-offset-y" min="-1.0" max="1.0" step="0.02" value="0.0" class="holo-slider" />
            </div>
            <div class="holo-slider-group">
              <label>Facing Rotation Y: <span id="lbl-val-rot-y">0°</span></label>
              <input type="range" id="slider-model-rot-y" min="-180" max="180" step="1" value="0" class="holo-slider" />
            </div>
          </div>
        </div>

        <!-- ================= TAB 2: BONE AUTO-MAPPER ================= -->
        <div id="tab-content-bones" class="tab-pane" style="display:none;">
          <div class="holo-section">
            <div class="holo-section-title">
              <span>FORWARD AXIS ORIENTATION</span>
            </div>
            <div class="holo-toggle-row">
              <label><input type="checkbox" id="chk-invert-x" /> Invert X</label>
              <label><input type="checkbox" id="chk-invert-y" /> Invert Y (-Y Fwd)</label>
              <label><input type="checkbox" id="chk-invert-z" /> Invert Z</label>
            </div>
          </div>

          <div class="holo-section">
            <div class="holo-section-title">
              <span>28-JOINT CANONICAL SKELETON</span>
              <button id="btn-auto-remap" class="holo-btn holo-btn-cyan" style="padding:2px 8px; font-size:10px;">⚡ AUTO-MAP</button>
            </div>
            <div id="joint-mapping-list" class="holo-joint-list"></div>
          </div>

          <div class="holo-section">
            <div class="holo-section-title">
              <span>TEST SINGLE JOINT ROTATION (DEG)</span>
            </div>
            <div class="holo-slider-group">
              <label>Yaw (X): <span id="lbl-val-x">0°</span></label>
              <input type="range" id="slider-bone-x" min="-180" max="180" value="0" class="holo-slider" />
            </div>
            <div class="holo-slider-group">
              <label>Pitch (Y): <span id="lbl-val-y">0°</span></label>
              <input type="range" id="slider-bone-y" min="-180" max="180" value="0" class="holo-slider" />
            </div>
            <div class="holo-slider-group">
              <label>Roll (Z): <span id="lbl-val-z">0°</span></label>
              <input type="range" id="slider-bone-z" min="-180" max="180" value="0" class="holo-slider" />
            </div>
            <button id="btn-reset-bone-angles" class="holo-btn holo-btn-secondary" style="width:100%; justify-content:center;">
              ${ICONS.refresh} RESET TEST ANGLES
            </button>
          </div>

          <div class="holo-section holo-action-row">
            <button id="btn-export-rig-config" class="holo-btn holo-btn-cyan" style="flex:1;">${ICONS.save} EXPORT JSON</button>
            <button id="btn-import-rig-config" class="holo-btn holo-btn-secondary" style="flex:1;">${ICONS.box} IMPORT JSON</button>
            <input type="file" id="config-file-input" accept=".json" style="display:none" />
          </div>
        </div>

        <!-- ================= TAB 3: SHADERS & FLASHY FX ================= -->
        <div id="tab-content-fx" class="tab-pane" style="display:none;">
          <div class="holo-section">
            <div class="holo-section-title">
              <span>HOLOGRAPHIC COLOR PALETTE</span>
            </div>
            <div class="holo-btn-grid">
              <button class="holo-btn" data-color="0x00f0ff" style="border-color:#00f0ff; color:#00f0ff;">◈ Cyan Core</button>
              <button class="holo-btn" data-color="0x8b5cf6" style="border-color:#8b5cf6; color:#a78bfa;">◈ Cyber Violet</button>
              <button class="holo-btn" data-color="0x10b981" style="border-color:#10b981; color:#34d399;">◈ Matrix Emerald</button>
              <button class="holo-btn" data-color="0xff0055" style="border-color:#ff0055; color:#ff3377;">◈ Crimson Alert</button>
              <button class="holo-btn" data-color="0xf59e0b" style="border-color:#f59e0b; color:#fbbf24;">◈ Solar Gold</button>
              <button class="holo-btn" data-color="0xffffff" style="border-color:#ffffff; color:#ffffff;">◈ Pure Quantum</button>
            </div>
          </div>

          <div class="holo-section">
            <div class="holo-section-title">
              <span>PARTICLE ATMOSPHERE & EMBER GLOW</span>
            </div>
            <div class="holo-slider-group">
              <label>Particle Glow Opacity: <span id="lbl-val-particles">38%</span></label>
              <input type="range" id="slider-particle-glow" min="5" max="90" value="38" class="holo-slider" />
            </div>
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
    const btnClose = this.container.querySelector('#btn-close-rig-studio');
    btnClose?.addEventListener('click', () => this.toggle(false));

    // Tab Navigation
    const tabs = this.container.querySelectorAll('.holo-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e: any) => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabKey = tab.getAttribute('data-tab') as 'model' | 'bones' | 'fx';
        this.switchTab(tabKey);
      });
    });

    // File Ingestion Dropzone & Browse Button
    const dropzone = this.container.querySelector('#rig-dropzone');
    const fileInput = this.container.querySelector('#rig-file-input') as HTMLInputElement;
    const btnBrowse = this.container.querySelector('#btn-browse-rig');

    btnBrowse?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async (e: any) => {
      if (e.target.files && e.target.files[0]) {
        await this.handleModelUpload(e.target.files[0]);
      }
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('hover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('hover'));
    dropzone?.addEventListener('drop', async (e: any) => {
      e.preventDefault();
      dropzone.classList.remove('hover');
      if (e.dataTransfer && e.dataTransfer.files[0]) {
        await this.handleModelUpload(e.dataTransfer.files[0]);
      }
    });

    // Reset default rig
    const btnResetRig = this.container.querySelector('#btn-reset-default-rig');
    btnResetRig?.addEventListener('click', () => {
      this.isCustomModel = false;
      this.activeModelName = 'XeroKratos Cybernetic Orchestrator';
      this.updateModelStats(1840, 28, false);
      this.callbacks.onResetToDefaultRig?.();
    });

    // Transform Sliders
    const sScale = this.container.querySelector('#slider-model-scale') as HTMLInputElement;
    const sOffsetY = this.container.querySelector('#slider-model-offset-y') as HTMLInputElement;
    const sRotY = this.container.querySelector('#slider-model-rot-y') as HTMLInputElement;
    const lblScale = this.container.querySelector('#lbl-val-scale');
    const lblOffsetY = this.container.querySelector('#lbl-val-offset-y');
    const lblRotY = this.container.querySelector('#lbl-val-rot-y');

    const updateTransforms = () => {
      this.modelScale = parseFloat(sScale.value);
      this.modelOffsetY = parseFloat(sOffsetY.value);
      this.modelRotYDeg = parseFloat(sRotY.value);

      if (lblScale) lblScale.textContent = `${this.modelScale.toFixed(2)}x`;
      if (lblOffsetY) lblOffsetY.textContent = `${this.modelOffsetY >= 0 ? '+' : ''}${this.modelOffsetY.toFixed(2)}m`;
      if (lblRotY) lblRotY.textContent = `${this.modelRotYDeg}°`;

      this.callbacks.onModelTransformChange?.(this.modelScale, this.modelOffsetY, this.modelRotYDeg);
    };

    sScale?.addEventListener('input', updateTransforms);
    sOffsetY?.addEventListener('input', updateTransforms);
    sRotY?.addEventListener('input', updateTransforms);

    // Axis Inversions
    ['x', 'y', 'z'].forEach((axis) => {
      const chk = this.container?.querySelector(`#chk-invert-${axis}`) as HTMLInputElement;
      chk?.addEventListener('change', () => {
        const key = `invert_${axis}` as 'invert_x' | 'invert_y' | 'invert_z';
        this.axisInversions[key] = chk.checked;
        this.callbacks.onAxisInvertToggle?.(key, chk.checked);
      });
    });

    // Test angle sliders
    const sliderX = this.container.querySelector('#slider-bone-x') as HTMLInputElement;
    const sliderY = this.container.querySelector('#slider-bone-y') as HTMLInputElement;
    const sliderZ = this.container.querySelector('#slider-bone-z') as HTMLInputElement;
    const lblX = this.container.querySelector('#lbl-val-x');
    const lblY = this.container.querySelector('#lbl-val-y');
    const lblZ = this.container.querySelector('#lbl-val-z');

    const updateSliders = () => {
      this.testAngles = [
        parseFloat(sliderX.value),
        parseFloat(sliderY.value),
        parseFloat(sliderZ.value)
      ];
      if (lblX) lblX.textContent = `${this.testAngles[0]}°`;
      if (lblY) lblY.textContent = `${this.testAngles[1]}°`;
      if (lblZ) lblZ.textContent = `${this.testAngles[2]}°`;

      if (this.currentBoneName) {
        this.callbacks.onTestAngleChange?.(this.currentBoneName, this.testAngles);
      }
    };

    sliderX?.addEventListener('input', updateSliders);
    sliderY?.addEventListener('input', updateSliders);
    sliderZ?.addEventListener('input', updateSliders);

    const btnResetAngles = this.container.querySelector('#btn-reset-bone-angles');
    btnResetAngles?.addEventListener('click', () => {
      if (sliderX) sliderX.value = '0';
      if (sliderY) sliderY.value = '0';
      if (sliderZ) sliderZ.value = '0';
      updateSliders();
    });

    // Color Palette Buttons
    const colorButtons = this.container.querySelectorAll('[data-color]');
    colorButtons.forEach((btn) => {
      btn.addEventListener('click', (e: any) => {
        const hexStr = btn.getAttribute('data-color') || '0x00f0ff';
        const hex = parseInt(hexStr, 16);
        this.callbacks.onShaderPaletteChange?.(hex);
      });
    });

    // Particle Intensity Slider
    const sliderParticles = this.container.querySelector('#slider-particle-glow') as HTMLInputElement;
    sliderParticles?.addEventListener('input', () => {
      const val = parseFloat(sliderParticles.value);
      const lbl = this.container?.querySelector('#lbl-val-particles');
      if (lbl) lbl.textContent = `${val}%`;
      this.callbacks.onParticleIntensityChange?.(val / 100);
    });

    // Export & Import
    const btnExport = this.container.querySelector('#btn-export-rig-config');
    btnExport?.addEventListener('click', () => this.exportCurrentConfig());

    const btnImport = this.container.querySelector('#btn-import-rig-config');
    const configInput = this.container.querySelector('#config-file-input') as HTMLInputElement;
    btnImport?.addEventListener('click', () => configInput?.click());
    configInput?.addEventListener('change', (e: any) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (re) => {
          try {
            const parsed = JSON.parse(re.target?.result as string);
            this.importConfig(parsed);
          } catch (err) {
            console.error('[RigStudioDrawer] Failed to parse config JSON:', err);
          }
        };
        reader.readAsText(e.target.files[0]);
      }
    });
  }

  private switchTab(tabKey: 'model' | 'bones' | 'fx'): void {
    this.currentTab = tabKey;
    if (!this.container) return;

    ['model', 'bones', 'fx'].forEach((t) => {
      const pane = this.container?.querySelector(`#tab-content-${t}`) as HTMLElement;
      if (pane) {
        pane.style.display = t === tabKey ? 'block' : 'none';
      }
    });
  }

  public async handleModelUpload(file: File): Promise<void> {
    try {
      const model = await UniversalModelLoader.loadFromFile(file);
      this.isCustomModel = true;
      this.activeModelName = file.name;
      this.detectedBones = model.rawBoneNames;

      // Update mapping table
      this.currentMapping = {};
      const jointMap = model.canonicalJointMap || new Map();
      for (const [canonical, bone] of jointMap.entries()) {
        this.currentMapping[canonical] = bone.name;
      }

      this.updateModelStats(model.stats?.triangleCount || 0, model.bones.size, true);
      this.populateJoints(this.detectedBones, this.currentMapping);
      this.callbacks.onModelLoaded?.(model);
    } catch (err: any) {
      alert(`Model loading error: ${err.message}`);
    }
  }

  public updateModelStats(triangles: number, bones: number, isCustom: boolean): void {
    if (!this.container) return;
    const lblName = this.container.querySelector('#lbl-active-model-name');
    const badgeStatus = this.container.querySelector('#badge-model-status');
    const statTri = this.container.querySelector('#stat-triangles');
    const statBones = this.container.querySelector('#stat-bones');

    if (lblName) lblName.textContent = this.activeModelName;
    if (badgeStatus) {
      badgeStatus.textContent = isCustom ? 'CUSTOM 3D MODEL' : 'BUILT-IN RIG';
      badgeStatus.className = isCustom ? 'holo-badge holo-badge-speaking' : 'holo-badge holo-badge-listening';
    }
    if (statTri) statTri.textContent = triangles.toLocaleString();
    if (statBones) statBones.textContent = `${bones} BONES`;
  }

  public populateJoints(detectedBones: string[], currentMapping: Record<string, string>): void {
    this.detectedBones = detectedBones;
    this.currentMapping = { ...currentMapping };
    if (!this.container) return;

    const listEl = this.container.querySelector('#joint-mapping-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const allJoints = Object.values(Joint28);
    allJoints.forEach((joint) => {
      const row = document.createElement('div');
      row.className = 'holo-joint-row';

      const label = document.createElement('span');
      label.className = 'holo-joint-name';
      label.textContent = joint;

      const select = document.createElement('select');
      select.className = 'holo-select';

      const unassignedOpt = document.createElement('option');
      unassignedOpt.value = '';
      unassignedOpt.textContent = '-- Unmapped --';
      select.appendChild(unassignedOpt);

      detectedBones.forEach((bName) => {
        const opt = document.createElement('option');
        opt.value = bName;
        opt.textContent = bName;
        if (this.currentMapping[joint] === bName) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      select.addEventListener('change', () => {
        this.currentMapping[joint] = select.value;
        this.currentBoneName = select.value;
        this.callbacks.onJointMapChange?.(joint as Joint28, select.value);
        if (select.value) {
          this.callbacks.onBoneSelect?.(select.value);
        }
      });

      row.appendChild(label);
      row.appendChild(select);
      listEl.appendChild(row);
    });
  }

  public toggle(force?: boolean): void {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    if (this.container) {
      if (this.isOpen) {
        this.container.classList.remove('rig-studio-closed');
        this.container.classList.add('rig-studio-open');
      } else {
        this.container.classList.remove('rig-studio-open');
        this.container.classList.add('rig-studio-closed');
      }
    }
  }

  public exportCurrentConfig(): RigProfile {
    const config: RigProfile = {
      rig_name: this.activeModelName,
      rig_type: this.isCustomModel ? 'custom' : 'procedural',
      bone_mappings: { ...this.currentMapping },
      invert_x: this.axisInversions.invert_x,
      invert_y: this.axisInversions.invert_y,
      invert_z: this.axisInversions.invert_z,
      rest_pose_type: 'T_POSE',
      calib_quaternions: {}
    };

    if (typeof document !== 'undefined') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'rig_config.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    this.callbacks.onExportConfig?.(config);
    return config;
  }

  public importConfig(config: RigProfile): void {
    this.axisInversions.invert_x = !!config.invert_x;
    this.axisInversions.invert_y = !!config.invert_y;
    this.axisInversions.invert_z = !!config.invert_z;

    if (this.container) {
      const chkX = this.container.querySelector('#chk-invert-x') as HTMLInputElement;
      const chkY = this.container.querySelector('#chk-invert-y') as HTMLInputElement;
      const chkZ = this.container.querySelector('#chk-invert-z') as HTMLInputElement;
      if (chkX) chkX.checked = this.axisInversions.invert_x;
      if (chkY) chkY.checked = this.axisInversions.invert_y;
      if (chkZ) chkZ.checked = this.axisInversions.invert_z;
    }

    this.currentMapping = { ...config.bone_mappings };
    this.populateJoints(this.detectedBones, this.currentMapping);
    this.callbacks.onImportConfig?.(config);
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }
}
