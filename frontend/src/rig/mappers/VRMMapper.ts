import { CanonicalBone, BoneMappingEntry } from '../canonicalBones';

export class VRMMapper {
  private static readonly VRM_PATTERNS: Record<CanonicalBone, RegExp[]> = {
    [CanonicalBone.Hips]: [/j_bip_c_hips/i, /^hips$/i],
    [CanonicalBone.Spine]: [/j_bip_c_spine/i, /^spine$/i],
    [CanonicalBone.Chest]: [/j_bip_c_chest/i, /^chest$/i],
    [CanonicalBone.UpperChest]: [/j_bip_c_upperchest/i, /^upperchest$/i],
    [CanonicalBone.Neck]: [/j_bip_c_neck/i, /^neck$/i],
    [CanonicalBone.Head]: [/j_bip_c_head/i, /^head$/i],
    [CanonicalBone.LeftEye]: [/eye.*l/i, /j_adj_l_faceeye/i],
    [CanonicalBone.RightEye]: [/eye.*r/i, /j_adj_r_faceeye/i],
    [CanonicalBone.Jaw]: [/jaw/i, /j_bip_c_jaw/i],

    // Arms
    [CanonicalBone.LeftShoulder]: [/j_bip_l_shoulder/i, /^leftshoulder$/i],
    [CanonicalBone.LeftUpperArm]: [/j_bip_l_upperarm/i, /^leftupperarm$/i],
    [CanonicalBone.LeftLowerArm]: [/j_bip_l_lowerarm/i, /^leftlowerarm$/i],
    [CanonicalBone.LeftHand]: [/j_bip_l_hand/i, /^lefthand$/i],

    [CanonicalBone.RightShoulder]: [/j_bip_r_shoulder/i, /^rightshoulder$/i],
    [CanonicalBone.RightUpperArm]: [/j_bip_r_upperarm/i, /^rightupperarm$/i],
    [CanonicalBone.RightLowerArm]: [/j_bip_r_lowerarm/i, /^rightlowerarm$/i],
    [CanonicalBone.RightHand]: [/j_bip_r_hand/i, /^righthand$/i],

    // Fingers
    [CanonicalBone.LeftThumbMetacarpal]: [/j_bip_l_thumb1/i],
    [CanonicalBone.LeftThumbProximal]: [/j_bip_l_thumb2/i],
    [CanonicalBone.LeftThumbDistal]: [/j_bip_l_thumb3/i],
    [CanonicalBone.LeftIndexProximal]: [/j_bip_l_index1/i],
    [CanonicalBone.LeftIndexIntermediate]: [/j_bip_l_index2/i],
    [CanonicalBone.LeftIndexDistal]: [/j_bip_l_index3/i],
    [CanonicalBone.LeftMiddleProximal]: [/j_bip_l_middle1/i],
    [CanonicalBone.LeftMiddleIntermediate]: [/j_bip_l_middle2/i],
    [CanonicalBone.LeftMiddleDistal]: [/j_bip_l_middle3/i],
    [CanonicalBone.LeftRingProximal]: [/j_bip_l_ring1/i],
    [CanonicalBone.LeftRingIntermediate]: [/j_bip_l_ring2/i],
    [CanonicalBone.LeftRingDistal]: [/j_bip_l_ring3/i],
    [CanonicalBone.LeftLittleProximal]: [/j_bip_l_little1/i],
    [CanonicalBone.LeftLittleIntermediate]: [/j_bip_l_little2/i],
    [CanonicalBone.LeftLittleDistal]: [/j_bip_l_little3/i],

    [CanonicalBone.RightThumbMetacarpal]: [/j_bip_r_thumb1/i],
    [CanonicalBone.RightThumbProximal]: [/j_bip_r_thumb2/i],
    [CanonicalBone.RightThumbDistal]: [/j_bip_r_thumb3/i],
    [CanonicalBone.RightIndexProximal]: [/j_bip_r_index1/i],
    [CanonicalBone.RightIndexIntermediate]: [/j_bip_r_index2/i],
    [CanonicalBone.RightIndexDistal]: [/j_bip_r_index3/i],
    [CanonicalBone.RightMiddleProximal]: [/j_bip_r_middle1/i],
    [CanonicalBone.RightMiddleIntermediate]: [/j_bip_r_middle2/i],
    [CanonicalBone.RightMiddleDistal]: [/j_bip_r_middle3/i],
    [CanonicalBone.RightRingProximal]: [/j_bip_r_ring1/i],
    [CanonicalBone.RightRingIntermediate]: [/j_bip_r_ring2/i],
    [CanonicalBone.RightRingDistal]: [/j_bip_r_ring3/i],
    [CanonicalBone.RightLittleProximal]: [/j_bip_r_little1/i],
    [CanonicalBone.RightLittleIntermediate]: [/j_bip_r_little2/i],
    [CanonicalBone.RightLittleDistal]: [/j_bip_r_little3/i],

    // Legs
    [CanonicalBone.LeftUpperLeg]: [/j_bip_l_upperleg/i, /^leftupperleg$/i],
    [CanonicalBone.LeftLowerLeg]: [/j_bip_l_lowerleg/i, /^leftlowerleg$/i],
    [CanonicalBone.LeftFoot]: [/j_bip_l_foot/i, /^leftfoot$/i],
    [CanonicalBone.LeftToes]: [/j_bip_l_toebase/i, /^lefttoes$/i],

    [CanonicalBone.RightUpperLeg]: [/j_bip_r_upperleg/i, /^rightupperleg$/i],
    [CanonicalBone.RightLowerLeg]: [/j_bip_r_lowerleg/i, /^rightlowerleg$/i],
    [CanonicalBone.RightFoot]: [/j_bip_r_foot/i, /^rightfoot$/i],
    [CanonicalBone.RightToes]: [/j_bip_r_toebase/i, /^righttoes$/i],
  };

  public static mapSkeleton(boneNames: string[]): Map<CanonicalBone, BoneMappingEntry> {
    const table = new Map<CanonicalBone, BoneMappingEntry>();

    for (const [canonicalStr, patterns] of Object.entries(this.VRM_PATTERNS)) {
      const canonical = canonicalStr as CanonicalBone;
      for (const pattern of patterns) {
        const matched = boneNames.find(name => pattern.test(name));
        if (matched) {
          table.set(canonical, {
            canonical,
            sourceBoneName: matched,
            confidence: 0.99,
            isManualOverride: false,
          });
          break;
        }
      }
    }

    return table;
  }
}
