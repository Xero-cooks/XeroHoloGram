import { OpticalCalibrationConfig, StageMountType } from '../config/types';

export type CalibrationChangeListener = (config: OpticalCalibrationConfig) => void;

/**
 * Stage Calibration Controller
 * Manages live calibration changes, local storage persistence, and event notifications.
 */
export class StageCalibrationController {
  private config: OpticalCalibrationConfig;
  private listeners: CalibrationChangeListener[] = [];
  private static readonly STORAGE_KEY = 'xerohologram_optical_calibration';

  constructor(initialConfig: OpticalCalibrationConfig) {
    this.config = this.loadSavedConfig() || { ...initialConfig };
  }

  public getConfig(): OpticalCalibrationConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  public setMountType(mountType: StageMountType): void {
    this.config.mountType = mountType;
    if (mountType === 'pythagorean_45') {
      this.config.flipX = true;
      this.config.flipY = false;
      this.config.glassAngleDeg = 45.0;
    } else if (mountType === 'flat_viewport') {
      this.config.flipX = false;
      this.config.flipY = false;
      this.config.glassAngleDeg = 0.0;
    }
    this.notify();
  }

  public setAxisFlip(flipX: boolean, flipY: boolean): void {
    this.config.flipX = flipX;
    this.config.flipY = flipY;
    this.notify();
  }

  public setGlassAngle(deg: number): void {
    this.config.glassAngleDeg = deg;
    this.notify();
  }

  public setKeystoneCorner(corner: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft', point: [number, number]): void {
    this.config.keystone[corner] = point;
    this.config.keystone.enabled = true;
    this.notify();
  }

  public resetToDefaults(defaultConfig: OpticalCalibrationConfig): void {
    this.config = { ...defaultConfig };
    this.notify();
  }

  public subscribe(listener: CalibrationChangeListener): () => void {
    this.listeners.push(listener);
    listener(this.getConfig());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.saveConfig();
    const snapshot = this.getConfig();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private saveConfig(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(StageCalibrationController.STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch {
      // Storage unavailable or disabled
    }
  }

  private loadSavedConfig(): OpticalCalibrationConfig | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(StageCalibrationController.STORAGE_KEY);
        if (raw) return JSON.parse(raw) as OpticalCalibrationConfig;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }
}
