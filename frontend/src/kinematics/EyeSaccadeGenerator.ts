import * as THREE from 'three';

export interface SaccadeGazeOffset {
  yaw: number;   // radians
  pitch: number; // radians
}

export class EyeSaccadeGenerator {
  private meanInterval: number; // seconds (typically 2.0 to 3.0s)
  private nextSaccadeTime: number = 0;
  private currentOffset: THREE.Vector2 = new THREE.Vector2(0, 0);
  private targetOffset: THREE.Vector2 = new THREE.Vector2(0, 0);

  constructor(meanIntervalSeconds: number = 2.2) {
    this.meanInterval = meanIntervalSeconds;
    this.scheduleNextSaccade(0);
  }

  private scheduleNextSaccade(currentTime: number): void {
    // Exponential distribution interval: -ln(U) * mean
    const u = Math.max(Math.random(), 1e-4);
    const interval = -Math.log(u) * this.meanInterval;
    this.nextSaccadeTime = currentTime + Math.min(Math.max(interval, 0.4), 6.0);

    // Random micro-saccadic displacement (within +/- 3 degrees)
    const angleRange = (3.0 * Math.PI) / 180.0;
    this.targetOffset.set(
      (Math.random() - 0.5) * 2.0 * angleRange,
      (Math.random() - 0.5) * 1.5 * angleRange
    );
  }

  public update(currentTime: number, delta: number): SaccadeGazeOffset {
    if (currentTime >= this.nextSaccadeTime) {
      this.scheduleNextSaccade(currentTime);
    }

    // Fast ballistic jump (tau = 35ms)
    const alpha = 1.0 - Math.exp(-delta / 0.035);
    this.currentOffset.lerp(this.targetOffset, alpha);

    // Physiological micro-tremor (~40 Hz)
    const tremorYaw = Math.sin(currentTime * 250.0) * 0.001;
    const tremorPitch = Math.cos(currentTime * 230.0) * 0.001;

    return {
      yaw: this.currentOffset.x + tremorYaw,
      pitch: this.currentOffset.y + tremorPitch,
    };
  }
}
