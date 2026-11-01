import * as THREE from 'three';
import { SO3Math } from './SO3Math';
import { QuaternionContinuity } from './QuaternionContinuity';

export interface SpringDamperParams {
  naturalFrequency: number; // omega_n (rad/s, e.g. 18.0)
  dampingRatio: number;     // zeta (1.0 = critically damped)
}

/**
 * 60Hz SO(3) Critically Damped Quaternion Spring-Damper Solver
 */
export class SO3SpringDamper {
  public currentRotation: THREE.Quaternion;
  public targetRotation: THREE.Quaternion;
  public angularVelocity: THREE.Vector3; // rad/s
  public params: SpringDamperParams;

  constructor(
    initialRotation: THREE.Quaternion = new THREE.Quaternion(),
    params: SpringDamperParams = { naturalFrequency: 18.0, dampingRatio: 1.0 }
  ) {
    this.currentRotation = initialRotation.clone().normalize();
    this.targetRotation = initialRotation.clone().normalize();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.params = params;
  }

  public setTarget(target: THREE.Quaternion): void {
    this.targetRotation = QuaternionContinuity.ensureContinuity(this.currentRotation, target);
  }

  /**
   * Advances simulation step by delta seconds using symplectic integration
   */
  public step(delta: number): void {
    const dt = Math.min(delta, 0.05); // Stability clamp
    const { naturalFrequency: omega, dampingRatio: zeta } = this.params;

    // 1. Ensure hemisphere continuity
    const targetContinuous = QuaternionContinuity.ensureContinuity(this.currentRotation, this.targetRotation);

    // 2. Relative rotation error in Lie algebra so(3)
    const qErr = SO3Math.relativeRotation(this.currentRotation, targetContinuous);
    const thetaErr = SO3Math.log(qErr);

    // 3. Critically damped spring-damper acceleration: a = omega^2 * error - 2 * zeta * omega * v
    const kSpring = omega * omega;
    const kDamp = 2.0 * zeta * omega;

    const acceleration = new THREE.Vector3(
      kSpring * thetaErr.x - kDamp * this.angularVelocity.x,
      kSpring * thetaErr.y - kDamp * this.angularVelocity.y,
      kSpring * thetaErr.z - kDamp * this.angularVelocity.z
    );

    // 4. Update angular velocity
    this.angularVelocity.addScaledVector(acceleration, dt);

    // 5. Integrate rotation: delta_q = exp(omega * dt)
    const rotStep = this.angularVelocity.clone().multiplyScalar(dt);
    const deltaQ = SO3Math.exp(rotStep);

    // 6. Update current rotation and renormalize
    this.currentRotation.premultiply(deltaQ).normalize();
  }

  public reset(rotation: THREE.Quaternion = new THREE.Quaternion()): void {
    this.currentRotation = rotation.clone().normalize();
    this.targetRotation = rotation.clone().normalize();
    this.angularVelocity.set(0, 0, 0);
  }
}
