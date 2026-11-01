import * as THREE from 'three';

export interface BreathingState {
  chestPitchOffset: number; // radians
  spinePitchOffset: number; // radians
  chestExpansionScale: number; // 1.0 + delta
}

export class BreathingOscillator {
  private frequencyHz: number; // ~0.25 Hz = 15 breaths per minute
  private primaryAmplitude: number; // radians
  private secondaryAmplitude: number;

  constructor(breathsPerMinute: number = 14, amplitudeDeg: number = 1.4) {
    this.frequencyHz = breathsPerMinute / 60.0;
    this.primaryAmplitude = (amplitudeDeg * Math.PI) / 180.0;
    this.secondaryAmplitude = this.primaryAmplitude * 0.35;
  }

  public evaluate(timeSeconds: number): BreathingState {
    const phase = 2.0 * Math.PI * this.frequencyHz * timeSeconds;

    // Asymmetric breathing profile: smooth inhale and slightly longer relaxed exhale
    const breathWave = Math.sin(phase) + 0.25 * Math.sin(2.0 * phase - Math.PI * 0.5);

    const chestPitch = breathWave * this.primaryAmplitude;
    const spinePitch = breathWave * this.secondaryAmplitude;
    const expansion = 1.0 + breathWave * 0.015;

    return {
      chestPitchOffset: chestPitch,
      spinePitchOffset: spinePitch,
      chestExpansionScale: expansion,
    };
  }

  public getQuaternionOffset(pitchOffset: number): THREE.Quaternion {
    // Pitch rotation around local X axis
    return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchOffset);
  }
}
