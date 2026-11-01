import * as THREE from 'three';
import { CanonicalBone, BoneMappingTable } from './canonicalBones';
import { BindPoseNormalizer } from './BindPoseNormalizer';

export class BoneRetargeter {
  private bones: Map<string, THREE.Bone>;
  private mappingTable: BoneMappingTable;
  private isSourceAPose: boolean = false;
  private restRotations: Map<string, THREE.Quaternion> = new Map();

  constructor(bones: Map<string, THREE.Bone>, mappingTable: BoneMappingTable) {
    this.bones = bones;
    this.mappingTable = mappingTable;
    this.isSourceAPose = BindPoseNormalizer.isAPose(bones, mappingTable);

    // Cache rest bind rotations
    for (const [name, bone] of bones.entries()) {
      this.restRotations.set(name, bone.quaternion.clone());
    }
  }

  /**
   * Applies target rotation to a canonical bone
   * @param canonical Canonical bone enum
   * @param deltaRotation Quaternion offset to apply on top of bind pose
   */
  public applyBoneRotation(canonical: CanonicalBone, deltaRotation: THREE.Quaternion): void {
    const entry = this.mappingTable.get(canonical);
    if (!entry) return;

    const bone = this.bones.get(entry.sourceBoneName);
    if (!bone) return;

    const rest = this.restRotations.get(entry.sourceBoneName) || new THREE.Quaternion();
    const aPoseCorrection = BindPoseNormalizer.getCorrectionOffset(canonical, this.isSourceAPose);

    // Target = rest * aPoseCorrection * deltaRotation
    bone.quaternion.copy(rest).multiply(aPoseCorrection).multiply(deltaRotation);
  }

  /**
   * Resets all mapped bones back to their initial rest pose
   */
  public resetRestPose(): void {
    for (const [name, rest] of this.restRotations.entries()) {
      const bone = this.bones.get(name);
      if (bone) {
        bone.quaternion.copy(rest);
      }
    }
  }
}
