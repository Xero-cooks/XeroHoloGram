import { Joint28 } from './CanonicalSkeleton';

export interface AutoMapResult {
  joint: Joint28;
  matchedBoneName: string;
  confidence: number;
}

export class BoneAutoMapper {
  private static readonly FUZZY_PATTERNS: Record<Joint28, RegExp[]> = {
    [Joint28.pelvis]: [/pelvis/i, /hips/i, /root/i],
    [Joint28.spine_01]: [/spine_?0?1/i, /spine$/i, /def-spine$/i],
    [Joint28.spine_02]: [/spine_?0?2/i, /spine_?0?3/i, /chest/i, /def-spine\.001/i],
    [Joint28.neck]: [/neck/i, /def-spine\.004/i],
    [Joint28.head]: [/head$/i, /def-head/i],
    [Joint28.jaw]: [/jaw/i, /def-jaw/i, /mandible/i],

    // Left Arm
    [Joint28.clavicle_L]: [/clavicle_?l/i, /shoulder_?l/i, /leftshoulder/i],
    [Joint28.upper_arm_L]: [/upper_?arm.*l/i, /leftarm/i, /upperarm_l/i, /j_bip_l_upperarm/i],
    [Joint28.lower_arm_L]: [/lower_?arm.*l/i, /forearm.*l/i, /leftforearm/i, /j_bip_l_lowerarm/i],
    [Joint28.hand_L]: [/hand.*l/i, /lefthand/i, /hand_l/i, /j_bip_l_hand/i],
    [Joint28.thumb_L]: [/thumb.*l/i, /lefthandthumb/i],
    [Joint28.index_L]: [/index.*l/i, /lefthandindex/i],
    [Joint28.middle_L]: [/middle.*l/i, /lefthandmiddle/i],
    [Joint28.ring_L]: [/ring.*l/i, /lefthandring/i],
    [Joint28.pinky_L]: [/pinky.*l/i, /little.*l/i, /lefthandpinky/i],

    // Right Arm
    [Joint28.clavicle_R]: [/clavicle_?r/i, /shoulder_?r/i, /rightshoulder/i],
    [Joint28.upper_arm_R]: [/upper_?arm.*r/i, /rightarm/i, /upperarm_r/i, /j_bip_r_upperarm/i],
    [Joint28.lower_arm_R]: [/lower_?arm.*r/i, /forearm.*r/i, /rightforearm/i, /j_bip_r_lowerarm/i],
    [Joint28.hand_R]: [/hand.*r/i, /righthand/i, /hand_r/i, /j_bip_r_hand/i],
    [Joint28.thumb_R]: [/thumb.*r/i, /righthandthumb/i],
    [Joint28.index_R]: [/index.*r/i, /righthandindex/i],
    [Joint28.middle_R]: [/middle.*r/i, /righthandmiddle/i],
    [Joint28.ring_R]: [/ring.*r/i, /righthandring/i],
    [Joint28.pinky_R]: [/pinky.*r/i, /little.*r/i, /righthandpinky/i],

    // Legs
    [Joint28.upper_leg_L]: [/thigh.*l/i, /upper_?leg.*l/i, /leftupleg/i, /j_bip_l_upperleg/i],
    [Joint28.lower_leg_L]: [/calf.*l/i, /shin.*l/i, /lower_?leg.*l/i, /leftleg/i],
    [Joint28.upper_leg_R]: [/thigh.*r/i, /upper_?leg.*r/i, /rightupleg/i, /j_bip_r_upperleg/i],
    [Joint28.lower_leg_R]: [/calf.*r/i, /shin.*r/i, /lower_?leg.*r/i, /rightleg/i],
  };

  public static autoMapBones(boneNames: string[]): Map<Joint28, AutoMapResult> {
    const results = new Map<Joint28, AutoMapResult>();

    for (const [jointStr, patterns] of Object.entries(this.FUZZY_PATTERNS)) {
      const joint = jointStr as Joint28;
      for (const pattern of patterns) {
        const match = boneNames.find(name => pattern.test(name));
        if (match) {
          results.set(joint, {
            joint,
            matchedBoneName: match,
            confidence: 0.96,
          });
          break;
        }
      }
    }

    return results;
  }
}
