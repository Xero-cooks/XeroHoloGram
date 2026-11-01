import { Joint28 } from '../rig/CanonicalSkeleton';
import { RigProfile } from '../rig/RigCalibrator';
import * as THREE from 'three';

export interface RigStudioDrawerCallbacks {
  onBoneSelect?: (boneName: string) => void;
  onJointMapChange?: (canonicalJoint: Joint28, mappedBoneName: string) => void;
  onAxisInvertToggle?: (axis: 'invert_x' | 'invert_y' | 'invert_z', value: boolean) => void;
  onTestAngleChange?: (boneName: string, eulerDeg: [number, number, number]) => void;
  onExportConfig?: (config: RigProfile) => void;
  onImportConfig?: (config: RigProfile) => void;
  onModelFileDrop?: (file: File) => void;
}

export class RigStudioDrawer {
  public container: HTMLElement | null = null;
  private isOpen: boolean = false;
  private currentBoneName: string = '';
  private currentMapping: Record<string, string> = {};
  private detectedBones: string[] = [];
  private callbacks: RigStudioDrawerCallbacks;

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
        <h3>◈ UNIVERSAL BONE STUDIO</h3>
        <button id="btn-close-rig-studio" class="holo-btn-icon">✕</button>
      </div>

      <div class="holo-drawer-body">
        <!-- Rig Ingestion Area -->
        <div class="holo-section">
          <label class="holo-section-title">INGEST CUSTOM 3D RIG</label>
          <div id="rig-dropzone" class="holo-dropzone">
            <span>DRAG & DROP .GLB / .GLTF / .VRM</span>
            <input type="file" id="rig-file-input" accept=".glb,.gltf,.vrm" style="display:none" />
            <button id="btn-browse-rig" class="holo-btn holo-btn-cyan">BROWSE FILE</button>
          </div>
        </div>

        <!-- Axis Inversion Toggles -->
        <div class="holo-section">
          <label class="holo-section-title">FORWARD AXIS CORRECTION</label>
          <div class="holo-toggle-row">
            <label><input type="checkbox" id="chk-invert-x" /> Invert X</label>
            <label><input type="checkbox" id="chk-invert-y" /> Invert Y (-Y Fwd)</label>
            <label><input type="checkbox" id="chk-invert-z" /> Invert Z</label>
          </div>
        </div>

        <!-- 28-Joint Auto/Manual Mapping -->
        <div class="holo-section">
          <label class="holo-section-title">28-JOINT CANONICAL SKELETON MAPPING</label>
          <div id="joint-mapping-list" class="holo-joint-list"></div>
        </div>

        <!-- Single Bone Test Sliders -->
        <div class="holo-section">
          <label class="holo-section-title">TEST JOINT LOCAL ROTATION (DEG)</label>
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
          <button id="btn-reset-bone-angles" class="holo-btn holo-btn-secondary">RESET TEST ANGLES</button>
        </div>

        <!-- Config Export & Import -->
        <div class="holo-section holo-action-row">
          <button id="btn-export-rig-config" class="holo-btn holo-btn-cyan">EXPORT RIG_CONFIG.JSON</button>
          <button id="btn-import-rig-config" class="holo-btn holo-btn-secondary">IMPORT CONFIG</button>
          <input type="file" id="config-file-input" accept=".json" style="display:none" />
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

    // Reset angles
    const btnReset = this.container.querySelector('#btn-reset-bone-angles');
    btnReset?.addEventListener('click', () => {
      if (sliderX) sliderX.value = '0';
      if (sliderY) sliderY.value = '0';
      if (sliderZ) sliderZ.value = '0';
      updateSliders();
    });

    // File Drop & Ingestion
    const dropzone = this.container.querySelector('#rig-dropzone');
    const fileInput = this.container.querySelector('#rig-file-input') as HTMLInputElement;
    const btnBrowse = this.container.querySelector('#btn-browse-rig');

    btnBrowse?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e: any) => {
      if (e.target.files && e.target.files[0]) {
        this.callbacks.onModelFileDrop?.(e.target.files[0]);
      }
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('hover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('hover'));
    dropzone?.addEventListener('drop', (e: any) => {
      e.preventDefault();
      dropzone.classList.remove('hover');
      if (e.dataTransfer && e.dataTransfer.files[0]) {
        this.callbacks.onModelFileDrop?.(e.dataTransfer.files[0]);
      }
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
      rig_name: 'custom_calibrated_rig',
      rig_type: 'custom',
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
