import * as THREE from 'three';
import { CanonicalBone, BoneMappingTable } from './canonicalBones';

export class BindPoseNormalizer {
  private static readonly A_TO_T_DELTA_LEFT = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    (45.0 * Math.PI) / 180.0 // Rotate left arm up +45 deg around Z
  );

  private static readonly A_TO_T_DELTA_RIGHT = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    (-45.0 * Math.PI) / 180.0 // Rotate right arm up -45 deg around Z
  );

  /**
   * Detects whether source skeleton is in A-Pose based on shoulder/upper-arm vector downward tilt
   */
  public static isAPose(
    bones: Map<string, THREE.Bone>,
    mappingTable: BoneMappingTable
  ): boolean {
    const leftArmEntry = mappingTable.get(CanonicalBone.LeftUpperArm);
    const leftHandEntry = mappingTable.get(CanonicalBone.LeftHand);

    if (!leftArmEntry || !leftHandEntry) return false;

    const leftArm = bones.get(leftArmEntry.sourceBoneName);
    const leftHand = bones.get(leftHandEntry.sourceBoneName);
    if (!leftArm || !leftHand) return false;

    const pArm = new THREE.Vector3();
    const pHand = new THREE.Vector3();
    leftArm.getWorldPosition(pArm);
    leftHand.getWorldPosition(pHand);

    const dir = new THREE.Vector3().subVectors(pHand, pArm).normalize();
    // In T-pose, arm points predominantly along +X (dir.x > 0.85, dir.y close to 0)
    // In A-pose, arm slopes downward (dir.y < -0.3)
    return dir.y < -0.25;
  }

  /**
   * Computes corrective quaternion for a specific canonical bone
   */
  public static getCorrectionOffset(
    canonical: CanonicalBone,
    isSourceAPose: boolean
  ): THREE.Quaternion {
    if (!isSourceAPose) {
      return new THREE.Quaternion(); // Identity
    }

    if (canonical === CanonicalBone.LeftUpperArm) {
      return this.A_TO_T_DELTA_LEFT.clone();
    }
    if (canonical === CanonicalBone.RightUpperArm) {
      return this.A_TO_T_DELTA_RIGHT.clone();
    }

    return new THREE.Quaternion();
  }
}
