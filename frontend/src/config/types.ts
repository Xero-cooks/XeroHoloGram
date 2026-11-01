/**
 * Optical Stage & Hologram Types
 */

export type StageMountType = 'pythagorean_45' | 'pyramid_4' | 'flat_viewport';

export interface OpticalCalibrationConfig {
  mountType: StageMountType;
  flipX: boolean;
  flipY: boolean;
  glassAngleDeg: number;       // Nominal 45 degrees
  glassThicknessMm: number;    // Refraction offset
  fovCompensation: boolean;
  customFovMultiplier: number;
  keystone: {
    enabled: boolean;
    topLeft: [number, number];
    topRight: [number, number];
    bottomRight: [number, number];
    bottomLeft: [number, number];
  };
}

export interface HologramShaderConfig {
  rimPower: number;
  rimColor: [number, number, number]; // Normalized RGB
  innerOpacity: number;
  scanlineIntensity: number;
  scanlineCount: number;
  chromaticAberration: number;
  flickerIntensity: number;
  bloomThreshold: number;
}

export interface HologramAppConfig {
  optical: OpticalCalibrationConfig;
  shader: HologramShaderConfig;
  wsEndpoint: string;
  targetFps: number;
}
