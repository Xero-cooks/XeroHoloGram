import * as THREE from 'three';
import { CanonicalBone } from '../rig/canonicalBones';

export interface AnatomicalLimits {
  minYaw: number;
  maxYaw: number;
  minPitch: number;
  maxPitch: number;
  minRoll: number;
  maxRoll: number;
}

export class JointLimitClamper {
  private static readonly DEG2RAD = Math.PI / 180.0;

  public static readonly BONE_LIMITS: Partial<Record<CanonicalBone, AnatomicalLimits>> = {
    [CanonicalBone.Head]: {
      minYaw: -45.0 * JointLimitClamper.DEG2RAD,
      maxYaw: 45.0 * JointLimitClamper.DEG2RAD,
      minPitch: -30.0 * JointLimitClamper.DEG2RAD,
      maxPitch: 40.0 * JointLimitClamper.DEG2RAD,
      minRoll: -20.0 * JointLimitClamper.DEG2RAD,
      maxRoll: 20.0 * JointLimitClamper.DEG2RAD,
    },
    [CanonicalBone.Neck]: {
      minYaw: -25.0 * JointLimitClamper.DEG2RAD,
      maxYaw: 25.0 * JointLimitClamper.DEG2RAD,
      minPitch: -20.0 * JointLimitClamper.DEG2RAD,
      maxPitch: 25.0 * JointLimitClamper.DEG2RAD,
      minRoll: -15.0 * JointLimitClamper.DEG2RAD,
      maxRoll: 15.0 * JointLimitClamper.DEG2RAD,
    },
    [CanonicalBone.LeftEye]: {
      minYaw: -30.0 * JointLimitClamper.DEG2RAD,
      maxYaw: 30.0 * JointLimitClamper.DEG2RAD,
      minPitch: -25.0 * JointLimitClamper.DEG2RAD,
      maxPitch: 25.0 * JointLimitClamper.DEG2RAD,
      minRoll: 0,
      maxRoll: 0,
    },
    [CanonicalBone.RightEye]: {
      minYaw: -30.0 * JointLimitClamper.DEG2RAD,
      maxYaw: 30.0 * JointLimitClamper.DEG2RAD,
      minPitch: -25.0 * JointLimitClamper.DEG2RAD,
      maxPitch: 25.0 * JointLimitClamper.DEG2RAD,
      minRoll: 0,
      maxRoll: 0,
    },
  };

  public static clampQuaternion(bone: CanonicalBone, q: THREE.Quaternion): THREE.Quaternion {
    const limits = this.BONE_LIMITS[bone];
    if (!limits) return q;

    const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
    euler.y = Math.min(Math.max(euler.y, limits.minYaw), limits.maxYaw);
    euler.x = Math.min(Math.max(euler.x, limits.minPitch), limits.maxPitch);
    euler.z = Math.min(Math.max(euler.z, limits.minRoll), limits.maxRoll);

    return new THREE.Quaternion().setFromEuler(euler);
  }
}
