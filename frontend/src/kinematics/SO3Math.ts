import * as THREE from 'three';

/**
 * Lie Group SO(3) & Lie Algebra so(3) Quaternion Operators
 */
export class SO3Math {
  /**
   * Logarithmic map: log(q): S^3 -> so(3)
   * Converts unit quaternion to 3D rotation vector (axis * angle)
   */
  public static log(q: THREE.Quaternion): THREE.Vector3 {
    const v = new THREE.Vector3(q.x, q.y, q.z);
    const vLen = v.length();

    if (vLen < 1e-7) {
      // Small angle approximation: theta ~ 0
      return new THREE.Vector3(2 * q.x, 2 * q.y, 2 * q.z);
    }

    const angle = 2.0 * Math.atan2(vLen, q.w);
    return v.multiplyScalar(angle / vLen);
  }

  /**
   * Exponential map: exp(v): so(3) -> S^3
   * Converts 3D rotation vector (axis * angle) to unit quaternion
   */
  public static exp(v: THREE.Vector3): THREE.Quaternion {
    const theta = v.length();
    const halfTheta = theta * 0.5;

    if (theta < 1e-7) {
      // Small angle approximation
      return new THREE.Quaternion(v.x * 0.5, v.y * 0.5, v.z * 0.5, 1.0).normalize();
    }

    const sinHalf = Math.sin(halfTheta);
    const cosHalf = Math.cos(halfTheta);
    const factor = sinHalf / theta;

    return new THREE.Quaternion(
      v.x * factor,
      v.y * factor,
      v.z * factor,
      cosHalf
    );
  }

  /**
   * Geodesic distance on SO(3) between two unit quaternions (in radians)
   */
  public static geodesicDistance(q1: THREE.Quaternion, q2: THREE.Quaternion): number {
    const dot = Math.abs(q1.dot(q2));
    const clamped = Math.min(Math.max(dot, 0.0), 1.0);
    return 2.0 * Math.acos(clamped);
  }

  /**
   * Relative rotation quaternion q_err = q_target * q_current^-1
   */
  public static relativeRotation(qCurrent: THREE.Quaternion, qTarget: THREE.Quaternion): THREE.Quaternion {
    const invCurrent = qCurrent.clone().invert();
    return qTarget.clone().multiply(invCurrent);
  }
}
