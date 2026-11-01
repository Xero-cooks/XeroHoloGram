import { CanonicalBone, BoneMappingTable, CANONICAL_BONE_PARENTS } from '../rig/canonicalBones';

export interface SkeletonMappingAudit {
  totalCanonical: number;
  mappedCount: number;
  coverageRatio: number;
  averageConfidence: number;
  missingCriticalBones: CanonicalBone[];
  unmappedBones: CanonicalBone[];
}

export class BoneHierarchyTree {
  private static readonly CRITICAL_BONES: CanonicalBone[] = [
    CanonicalBone.Hips,
    CanonicalBone.Spine,
    CanonicalBone.Neck,
    CanonicalBone.Head,
    CanonicalBone.LeftUpperArm,
    CanonicalBone.LeftLowerArm,
    CanonicalBone.LeftHand,
    CanonicalBone.RightUpperArm,
    CanonicalBone.RightLowerArm,
    CanonicalBone.RightHand,
  ];

  /**
   * Audits mapping completeness and confidence across the 55 canonical bones
   */
  public static auditMapping(table: BoneMappingTable): SkeletonMappingAudit {
    const allCanonical = Object.values(CanonicalBone);
    const unmapped: CanonicalBone[] = [];
    const missingCritical: CanonicalBone[] = [];
    let sumConfidence = 0.0;
    let mappedCount = 0;

    for (const bone of allCanonical) {
      const entry = table.get(bone);
      if (entry && entry.sourceBoneName) {
        mappedCount++;
        sumConfidence += entry.confidence;
      } else {
        unmapped.push(bone);
        if (this.CRITICAL_BONES.includes(bone)) {
          missingCritical.push(bone);
        }
      }
    }

    return {
      totalCanonical: allCanonical.length,
      mappedCount,
      coverageRatio: mappedCount / allCanonical.length,
      averageConfidence: mappedCount > 0 ? sumConfidence / mappedCount : 0.0,
      missingCriticalBones: missingCritical,
      unmappedBones: unmapped,
    };
  }

  /**
   * Manually sets or overrides a bone mapping in the table
   */
  public static setManualMapping(
    table: BoneMappingTable,
    canonical: CanonicalBone,
    sourceBoneName: string
  ): void {
    table.set(canonical, {
      canonical,
      sourceBoneName,
      confidence: 1.0,
      isManualOverride: true,
    });
  }

  /**
   * Returns ancestry chain from root to specified bone
   */
  public static getAncestryChain(bone: CanonicalBone): CanonicalBone[] {
    const chain: CanonicalBone[] = [bone];
    let current: CanonicalBone | undefined = bone;

    while (current && CANONICAL_BONE_PARENTS[current]) {
      current = CANONICAL_BONE_PARENTS[current];
      if (current) chain.unshift(current);
    }

    return chain;
  }
}
