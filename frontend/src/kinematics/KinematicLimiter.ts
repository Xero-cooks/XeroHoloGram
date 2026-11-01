import * as THREE from 'three';

export interface KinematicLimits {
  maxAngularVelocity: number;     // rad/s (e.g. 12.0)
  maxAngularAcceleration: number; // rad/s^2 (e.g. 60.0)
}

export class KinematicLimiter {
  public static clampVelocity(velocity: THREE.Vector3, maxSpeed: number): THREE.Vector3 {
    const speed = velocity.length();
    if (speed > maxSpeed && speed > 1e-6) {
      velocity.multiplyScalar(maxSpeed / speed);
    }
    return velocity;
  }

  public static clampAcceleration(
    currentVelocity: THREE.Vector3,
    targetVelocity: THREE.Vector3,
    maxAcc: number,
    dt: number
  ): THREE.Vector3 {
    const deltaV = new THREE.Vector3().subVectors(targetVelocity, currentVelocity);
    const maxDeltaV = maxAcc * dt;
    const mag = deltaV.length();

    if (mag > maxDeltaV && mag > 1e-6) {
      deltaV.multiplyScalar(maxDeltaV / mag);
    }

    return currentVelocity.clone().add(deltaV);
  }
}
