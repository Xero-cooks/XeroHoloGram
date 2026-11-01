import * as THREE from 'three';
import { Joint28 } from '../rig/CanonicalSkeleton';

export interface SpringParameters {
  omega: number; // Natural frequency (e.g. 18.0 rad/s)
  zeta: number;  // Damping ratio (1.0 = critically damped)
}

export class SpringSolver {
  private currentAngles: Map<Joint28, THREE.Vector3> = new Map();
  private targetAngles: Map<Joint28, THREE.Vector3> = new Map();
  private velocities: Map<Joint28, THREE.Vector3> = new Map();
  private params: Map<Joint28, SpringParameters> = new Map();

  constructor() {
    for (const joint of Object.values(Joint28)) {
      const j = joint as Joint28;
      this.currentAngles.set(j, new THREE.Vector3(0, 0, 0));
      this.targetAngles.set(j, new THREE.Vector3(0, 0, 0));
      this.velocities.set(j, new THREE.Vector3(0, 0, 0));

      // Fast response on head/neck (omega = 24), smoother on arms (omega = 16)
      const omega = (j === Joint28.head || j === Joint28.neck) ? 24.0 : 16.0;
      this.params.set(j, { omega, zeta: 1.0 });
    }
  }

  public setTargetDeg(joint: Joint28, eulerDeg: [number, number, number]): void {
    const rad = new THREE.Vector3(
      (eulerDeg[0] * Math.PI) / 180.0,
      (eulerDeg[1] * Math.PI) / 180.0,
      (eulerDeg[2] * Math.PI) / 180.0
    );
    this.targetAngles.get(joint)?.copy(rad);
  }

  /**
   * Semi-implicit analytical integration step at 60-120 Hz
   */
  public step(delta: number): void {
    const dt = Math.min(delta, 0.05);

    for (const joint of Object.values(Joint28)) {
      const j = joint as Joint28;
      const current = this.currentAngles.get(j)!;
      const target = this.targetAngles.get(j)!;
      const vel = this.velocities.get(j)!;
      const { omega, zeta } = this.params.get(j)!;

      const kSpring = omega * omega;
      const kDamp = 2.0 * zeta * omega;

      // Acceleration: a = omega^2 * (target - current) - 2*zeta*omega*v
      const ax = kSpring * (target.x - current.x) - kDamp * vel.x;
      const ay = kSpring * (target.y - current.y) - kDamp * vel.y;
      const az = kSpring * (target.z - current.z) - kDamp * vel.z;

      // Velocity update
      vel.x += ax * dt;
      vel.y += ay * dt;
      vel.z += az * dt;

      // Position update
      current.x += vel.x * dt;
      current.y += vel.y * dt;
      current.z += vel.z * dt;
    }
  }

  public getQuaternion(joint: Joint28): THREE.Quaternion {
    const angles = this.currentAngles.get(joint) || new THREE.Vector3();
    const euler = new THREE.Euler(angles.x, angles.y, angles.z, 'YXZ');
    return new THREE.Quaternion().setFromEuler(euler);
  }

  public getCurrentEulerRad(joint: Joint28): THREE.Vector3 {
    return this.currentAngles.get(joint) || new THREE.Vector3();
  }

  public flushVelocities(): void {
    for (const vel of this.velocities.values()) {
      vel.set(0, 0, 0);
    }
  }
}
