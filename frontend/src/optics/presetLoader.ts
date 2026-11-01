import { OpticalCalibrationConfig, StageMountType } from '../config/types';

export interface OpticalPreset extends OpticalCalibrationConfig {
  name: string;
}

export class OpticalPresetLoader {
  private static presetCache: Map<StageMountType, OpticalPreset> = new Map();

  public static async loadPreset(mountType: StageMountType): Promise<OpticalPreset> {
    if (this.presetCache.has(mountType)) {
      return this.presetCache.get(mountType)!;
    }

    try {
      const response = await fetch(`/presets/${mountType}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load preset: ${mountType}`);
      }
      const data = await response.json() as OpticalPreset;
      this.presetCache.set(mountType, data);
      return data;
    } catch {
      // Fallback preset
      return this.getFallbackPreset(mountType);
    }
  }

  public static getFallbackPreset(mountType: StageMountType): OpticalPreset {
    switch (mountType) {
      case 'pythagorean_45':
        return {
          name: 'Single 45° Pythagorean Reflector',
          mountType: 'pythagorean_45',
          flipX: true,
          flipY: false,
          glassAngleDeg: 45.0,
          glassThicknessMm: 4.0,
          fovCompensation: true,
          customFovMultiplier: 1.0,
          keystone: {
            enabled: false,
            topLeft: [0, 0],
            topRight: [1, 0],
            bottomRight: [1, 1],
            bottomLeft: [0, 1]
          }
        };
      case 'pyramid_4':
        return {
          name: '4-Sided Holographic Pyramid Stage',
          mountType: 'pyramid_4',
          flipX: true,
          flipY: true,
          glassAngleDeg: 52.5,
          glassThicknessMm: 3.0,
          fovCompensation: true,
          customFovMultiplier: 0.85,
          keystone: {
            enabled: true,
            topLeft: [0.08, 0.05],
            topRight: [0.92, 0.05],
            bottomRight: [1.0, 0.98],
            bottomLeft: [0.0, 0.98]
          }
        };
      case 'flat_viewport':
      default:
        return {
          name: 'Standard Flat 3D Web Viewport',
          mountType: 'flat_viewport',
          flipX: false,
          flipY: false,
          glassAngleDeg: 0.0,
          glassThicknessMm: 0.0,
          fovCompensation: false,
          customFovMultiplier: 1.0,
          keystone: {
            enabled: false,
            topLeft: [0, 0],
            topRight: [1, 0],
            bottomRight: [1, 1],
            bottomLeft: [0, 1]
          }
        };
    }
  }
}
