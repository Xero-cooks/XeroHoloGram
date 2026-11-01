import * as THREE from 'three';
import { CanonicalBone } from '../rig/canonicalBones';

export interface GazeDistributionResult {
  rotations: Map<CanonicalBone, THREE.Quaternion>;
}

export class LookAtGazeSolver {
  private static readonly WEIGHTS: Record<CanonicalBone, number> = {
    [CanonicalBone.Spine]: 0.10,
    [CanonicalBone.Chest]: 0.15,
    [CanonicalBone.Neck]: 0.25,
    [CanonicalBone.Head]: 0.35,
    [CanonicalBone.LeftEye]: 0.15,
    [CanonicalBone.RightEye]: 0.15,
  } as any;

  /**
   * Computes distributed rotations across cervical spine to look at target in avatar local space
   */
  public static solveLookAt(
    targetWorld: THREE.Vector3,
    headWorldPos: THREE.Vector3,
    avatarWorldQuat: THREE.Quaternion
  ): GazeDistributionResult {
    const dir = new THREE.Vector3().subVectors(targetWorld, headWorldPos).normalize();
    // Transform direction into avatar local coordinate space
    const invAvatar = avatarWorldQuat.clone().invert();
    const localDir = dir.applyQuaternion(invAvatar);

    // Compute yaw and pitch
    const totalYaw = Math.atan2(localDir.x, localDir.z);
    const totalPitch = -Math.asin(Math.min(Math.max(localDir.y, -0.99), 0.99));

    const rotations = new Map<CanonicalBone, THREE.Quaternion>();

    for (const [boneStr, weight] of Object.entries(this.WEIGHTS)) {
      const bone = boneStr as CanonicalBone;
      const boneYaw = totalYaw * (weight as number);
      const bonePitch = totalPitch * (weight as number);

      const euler = new THREE.Euler(bonePitch, boneYaw, 0, 'YXZ');
      const q = new THREE.Quaternion().setFromEuler(euler);
      rotations.set(bone, q);
    }

    return { rotations };
  }
}
