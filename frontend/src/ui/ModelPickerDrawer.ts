export class ModelPickerDrawer {
  private container: HTMLElement;
  private onModelUploadCallback?: (file: File) => void;
  private onToggleBoneStudioCallback?: (active: boolean) => void;
  private isStudioActive: boolean = false;

  constructor(
    container: HTMLElement,
    callbacks?: {
      onModelUpload?: (file: File) => void;
      onToggleBoneStudio?: (active: boolean) => void;
    }
  ) {
    this.container = container;
    this.onModelUploadCallback = callbacks?.onModelUpload;
    this.onToggleBoneStudioCallback = callbacks?.onToggleBoneStudio;
    this.render();
  }

  private render(): void {
    const el = document.createElement('div');
    el.className = 'hud-section';
    el.style.borderTop = '1px solid rgba(0, 229, 255, 0.2)';
    el.style.paddingTop = '10px';
    el.style.marginTop = '10px';

    el.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">3D RIG & AVATAR STUDIO</div>
      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
        <label style="flex: 1; text-align: center; background: rgba(0, 229, 255, 0.15); border: 1px dashed #00e5ff; border-radius: 4px; padding: 6px; cursor: pointer; font-size: 11px;">
          Upload .GLB/.VRM
          <input type="file" id="model-file-input" accept=".glb,.gltf,.vrm" style="display: none;" />
        </label>
        <button id="toggle-bone-studio-btn" style="flex: 1; background: rgba(0, 40, 70, 0.7); border: 1px solid #00e5ff; color: #00e5ff; border-radius: 4px; font-size: 11px; cursor: pointer;">
          Bone Studio
        </button>
      </div>
      <div id="rig-coverage-badge" style="font-size: 10px; color: #00ff88;">
        Avatar: Procedural Hologram Rig (55/55 bones mapped)
      </div>
    `;

    this.container.appendChild(el);

    const fileInput = el.querySelector('#model-file-input') as HTMLInputElement;
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        this.onModelUploadCallback?.(fileInput.files[0]);
      }
    });

    const studioBtn = el.querySelector('#toggle-bone-studio-btn') as HTMLButtonElement;
    studioBtn.addEventListener('click', () => {
      this.isStudioActive = !this.isStudioActive;
      studioBtn.style.background = this.isStudioActive ? 'rgba(0, 229, 255, 0.35)' : 'rgba(0, 40, 70, 0.7)';
      this.onToggleBoneStudioCallback?.(this.isStudioActive);
    });
  }

  public updateCoverageText(text: string): void {
    const badge = this.container.querySelector('#rig-coverage-badge');
    if (badge) badge.textContent = text;
  }
}
