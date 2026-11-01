import { StageCalibrationController } from '../optics/CalibrationController';
import { OpticalCalibrationConfig, StageMountType } from '../config/types';

export class OpticalControls {
  private controller: StageCalibrationController;
  private container: HTMLElement;

  constructor(container: HTMLElement, controller: StageCalibrationController) {
    this.container = container;
    this.controller = controller;
    this.render();
  }

  private render(): void {
    const config = this.controller.getConfig();
    const section = document.createElement('div');
    section.className = 'hud-section';
    section.innerHTML = `
      <style>
        .control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 12px;
        }
        .control-select, .control-slider {
          background: rgba(0, 30, 50, 0.6);
          border: 1px solid rgba(0, 229, 255, 0.4);
          color: #00e5ff;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
        }
        .control-slider {
          width: 140px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
      </style>
      <div class="control-row">
        <label>Stage Preset:</label>
        <select id="stage-mount-select" class="control-select">
          <option value="pythagorean_45" ${config.mountType === 'pythagorean_45' ? 'selected' : ''}>45° Pythagorean</option>
          <option value="pyramid_4" ${config.mountType === 'pyramid_4' ? 'selected' : ''}>4-Sided Pyramid</option>
          <option value="flat_viewport" ${config.mountType === 'flat_viewport' ? 'selected' : ''}>Flat Viewport</option>
        </select>
      </div>
      <div class="control-row">
        <label class="checkbox-label">
          <input type="checkbox" id="flip-x-toggle" ${config.flipX ? 'checked' : ''} />
          Flip Horizontal (X)
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="flip-y-toggle" ${config.flipY ? 'checked' : ''} />
          Flip Vertical (Y)
        </label>
      </div>
      <div class="control-row">
        <label>Glass Angle:</label>
        <input type="range" id="glass-angle-slider" class="control-slider" min="0" max="65" step="0.5" value="${config.glassAngleDeg}" />
        <span id="glass-angle-val">${config.glassAngleDeg}°</span>
      </div>
    `;

    this.container.appendChild(section);
    this.bindEvents(section);
  }

  private bindEvents(section: HTMLElement): void {
    const mountSelect = section.querySelector('#stage-mount-select') as HTMLSelectElement;
    mountSelect.addEventListener('change', () => {
      this.controller.setMountType(mountSelect.value as StageMountType);
    });

    const flipX = section.querySelector('#flip-x-toggle') as HTMLInputElement;
    const flipY = section.querySelector('#flip-y-toggle') as HTMLInputElement;
    const onFlipChange = () => this.controller.setAxisFlip(flipX.checked, flipY.checked);
    flipX.addEventListener('change', onFlipChange);
    flipY.addEventListener('change', onFlipChange);

    const angleSlider = section.querySelector('#glass-angle-slider') as HTMLInputElement;
    const angleVal = section.querySelector('#glass-angle-val') as HTMLSpanElement;
    angleSlider.addEventListener('input', () => {
      const val = parseFloat(angleSlider.value);
      angleVal.textContent = `${val}°`;
      this.controller.setGlassAngle(val);
    });
  }
}
