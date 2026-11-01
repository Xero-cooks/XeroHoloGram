import { HologramAppConfig } from './types';

export const DEFAULT_STAGE_CONFIG: HologramAppConfig = {
  optical: {
    mountType: 'pythagorean_45',
    flipX: true,               // Pepper's ghost reflector inverts horizontal chirality
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
      bottomLeft: [0, 1],
    },
  },
  shader: {
    rimPower: 3.2,
    rimColor: [0.15, 0.85, 1.0], // Holographic cyan
    innerOpacity: 0.88,
    scanlineIntensity: 0.18,
    scanlineCount: 420.0,
    chromaticAberration: 0.0035,
    flickerIntensity: 0.03,
    bloomThreshold: 0.65,
  },
  wsEndpoint: 'ws://localhost:8765/ws/hologram',
  targetFps: 60,
};
