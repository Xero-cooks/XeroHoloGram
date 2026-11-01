import * as THREE from 'three';

export class QuaternionContinuity {
  /**
   * Enforces hemisphere continuity: if qTarget is antipodal (dot < 0), negate components
   */
  public static ensureContinuity(qBase: THREE.Quaternion, qTarget: THREE.Quaternion): THREE.Quaternion {
    const result = qTarget.clone();
    if (qBase.dot(result) < 0) {
      result.x = -result.x;
      result.y = -result.y;
      result.z = -result.z;
      result.w = -result.w;
    }
    return result;
  }

  /**
   * Continuous Slerp interpolation with sign check
   */
  public static continuousSlerp(
    q1: THREE.Quaternion,
    q2: THREE.Quaternion,
    t: number
  ): THREE.Quaternion {
    const q2Continuous = this.ensureContinuity(q1, q2);
    return q1.clone().slerp(q2Continuous, t);
  }
}
