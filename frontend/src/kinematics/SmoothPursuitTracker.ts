import * as THREE from 'three';

export class SmoothPursuitTracker {
  private currentTarget: THREE.Vector3;
  private smoothedTarget: THREE.Vector3;
  private velocity: THREE.Vector3;
  private deadbandRadius: number;
  private lagSeconds: number;

  constructor(deadbandRadius: number = 0.05, lagSeconds: number = 0.18) {
    this.currentTarget = new THREE.Vector3(0, 1.5, 2.0);
    this.smoothedTarget = this.currentTarget.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.deadbandRadius = deadbandRadius;
    this.lagSeconds = lagSeconds;
  }

  public setTarget(target: THREE.Vector3): void {
    // Check deadband to prevent jitter when target is nearly static
    if (this.currentTarget.distanceTo(target) > this.deadbandRadius) {
      this.currentTarget.copy(target);
    }
  }

  public update(delta: number): THREE.Vector3 {
    const dt = Math.min(delta, 0.1);
    const alpha = 1.0 - Math.exp(-dt / this.lagSeconds);

    this.smoothedTarget.lerp(this.currentTarget, alpha);
    return this.smoothedTarget.clone();
  }

  public getPosition(): THREE.Vector3 {
    return this.smoothedTarget.clone();
  }
}
