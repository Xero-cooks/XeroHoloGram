import { CanonicalBone, BoneMappingEntry } from '../canonicalBones';

export class UnrealEngineMapper {
  private static readonly UE_PATTERNS: Record<CanonicalBone, RegExp[]> = {
    [CanonicalBone.Hips]: [/^pelvis$/i],
    [CanonicalBone.Spine]: [/^spine_01$/i, /^spine$/i],
    [CanonicalBone.Chest]: [/^spine_02$/i],
    [CanonicalBone.UpperChest]: [/^spine_03$/i],
    [CanonicalBone.Neck]: [/^neck_01$/i, /^neck$/i],
    [CanonicalBone.Head]: [/^head$/i],
    [CanonicalBone.LeftEye]: [/eye_l/i],
    [CanonicalBone.RightEye]: [/eye_r/i],
    [CanonicalBone.Jaw]: [/jaw/i],

    // Arms
    [CanonicalBone.LeftShoulder]: [/^clavicle_l$/i],
    [CanonicalBone.LeftUpperArm]: [/^upperarm_l$/i],
    [CanonicalBone.LeftLowerArm]: [/^lowerarm_l$/i],
    [CanonicalBone.LeftHand]: [/^hand_l$/i],

    [CanonicalBone.RightShoulder]: [/^clavicle_r$/i],
    [CanonicalBone.RightUpperArm]: [/^upperarm_r$/i],
    [CanonicalBone.RightLowerArm]: [/^lowerarm_r$/i],
    [CanonicalBone.RightHand]: [/^hand_r$/i],

    // Fingers
    [CanonicalBone.LeftThumbMetacarpal]: [/^thumb_01_l$/i],
    [CanonicalBone.LeftThumbProximal]: [/^thumb_02_l$/i],
    [CanonicalBone.LeftThumbDistal]: [/^thumb_03_l$/i],
    [CanonicalBone.LeftIndexProximal]: [/^index_01_l$/i],
    [CanonicalBone.LeftIndexIntermediate]: [/^index_02_l$/i],
    [CanonicalBone.LeftIndexDistal]: [/^index_03_l$/i],
    [CanonicalBone.LeftMiddleProximal]: [/^middle_01_l$/i],
    [CanonicalBone.LeftMiddleIntermediate]: [/^middle_02_l$/i],
    [CanonicalBone.LeftMiddleDistal]: [/^middle_03_l$/i],
    [CanonicalBone.LeftRingProximal]: [/^ring_01_l$/i],
    [CanonicalBone.LeftRingIntermediate]: [/^ring_02_l$/i],
    [CanonicalBone.LeftRingDistal]: [/^ring_03_l$/i],
    [CanonicalBone.LeftLittleProximal]: [/^pinky_01_l$/i],
    [CanonicalBone.LeftLittleIntermediate]: [/^pinky_02_l$/i],
    [CanonicalBone.LeftLittleDistal]: [/^pinky_03_l$/i],

    [CanonicalBone.RightThumbMetacarpal]: [/^thumb_01_r$/i],
    [CanonicalBone.RightThumbProximal]: [/^thumb_02_r$/i],
    [CanonicalBone.RightThumbDistal]: [/^thumb_03_r$/i],
    [CanonicalBone.RightIndexProximal]: [/^index_01_r$/i],
    [CanonicalBone.RightIndexIntermediate]: [/^index_02_r$/i],
    [CanonicalBone.RightIndexDistal]: [/^index_03_r$/i],
    [CanonicalBone.RightMiddleProximal]: [/^middle_01_r$/i],
    [CanonicalBone.RightMiddleIntermediate]: [/^middle_02_r$/i],
    [CanonicalBone.RightMiddleDistal]: [/^middle_03_r$/i],
    [CanonicalBone.RightRingProximal]: [/^ring_01_r$/i],
    [CanonicalBone.RightRingIntermediate]: [/^ring_02_r$/i],
    [CanonicalBone.RightRingDistal]: [/^ring_03_r$/i],
    [CanonicalBone.RightLittleProximal]: [/^pinky_01_r$/i],
    [CanonicalBone.RightLittleIntermediate]: [/^pinky_02_r$/i],
    [CanonicalBone.RightLittleDistal]: [/^pinky_03_r$/i],

    // Legs
    [CanonicalBone.LeftUpperLeg]: [/^thigh_l$/i],
    [CanonicalBone.LeftLowerLeg]: [/^calf_l$/i],
    [CanonicalBone.LeftFoot]: [/^foot_l$/i],
    [CanonicalBone.LeftToes]: [/^ball_l$/i],

    [CanonicalBone.RightUpperLeg]: [/^thigh_r$/i],
    [CanonicalBone.RightLowerLeg]: [/^calf_r$/i],
    [CanonicalBone.RightFoot]: [/^foot_r$/i],
    [CanonicalBone.RightToes]: [/^ball_r$/i],
  };

  public static mapSkeleton(boneNames: string[]): Map<CanonicalBone, BoneMappingEntry> {
    const table = new Map<CanonicalBone, BoneMappingEntry>();

    for (const [canonicalStr, patterns] of Object.entries(this.UE_PATTERNS)) {
      const canonical = canonicalStr as CanonicalBone;
      for (const pattern of patterns) {
        const matched = boneNames.find(name => pattern.test(name));
        if (matched) {
          table.set(canonical, {
            canonical,
            sourceBoneName: matched,
            confidence: 0.97,
            isManualOverride: false,
          });
          break;
        }
      }
    }

    return table;
  }
}
