import { CanonicalBone, BoneMappingEntry } from '../canonicalBones';

export class MixamoMapper {
  private static readonly MIXAMO_PATTERNS: Record<CanonicalBone, RegExp[]> = {
    [CanonicalBone.Hips]: [/mixamorig.*:?hips/i],
    [CanonicalBone.Spine]: [/mixamorig.*:?spine$/i, /mixamorig.*:?spine_?0?1/i],
    [CanonicalBone.Chest]: [/mixamorig.*:?spine1/i, /mixamorig.*:?spine_?0?2/i],
    [CanonicalBone.UpperChest]: [/mixamorig.*:?spine2/i, /mixamorig.*:?spine_?0?3/i],
    [CanonicalBone.Neck]: [/mixamorig.*:?neck/i],
    [CanonicalBone.Head]: [/mixamorig.*:?head$/i],
    [CanonicalBone.LeftEye]: [/mixamorig.*:?lefteye/i],
    [CanonicalBone.RightEye]: [/mixamorig.*:?righteye/i],
    [CanonicalBone.Jaw]: [/mixamorig.*:?jaw/i],

    // Left Arm
    [CanonicalBone.LeftShoulder]: [/mixamorig.*:?leftshoulder/i],
    [CanonicalBone.LeftUpperArm]: [/mixamorig.*:?leftarm$/i],
    [CanonicalBone.LeftLowerArm]: [/mixamorig.*:?leftforearm/i],
    [CanonicalBone.LeftHand]: [/mixamorig.*:?lefthand$/i],

    // Right Arm
    [CanonicalBone.RightShoulder]: [/mixamorig.*:?rightshoulder/i],
    [CanonicalBone.RightUpperArm]: [/mixamorig.*:?rightarm$/i],
    [CanonicalBone.RightLowerArm]: [/mixamorig.*:?rightforearm/i],
    [CanonicalBone.RightHand]: [/mixamorig.*:?righthand$/i],

    // Left Fingers
    [CanonicalBone.LeftThumbMetacarpal]: [/mixamorig.*:?lefthandthumb1/i],
    [CanonicalBone.LeftThumbProximal]: [/mixamorig.*:?lefthandthumb2/i],
    [CanonicalBone.LeftThumbDistal]: [/mixamorig.*:?lefthandthumb3/i],
    [CanonicalBone.LeftIndexProximal]: [/mixamorig.*:?lefthandindex1/i],
    [CanonicalBone.LeftIndexIntermediate]: [/mixamorig.*:?lefthandindex2/i],
    [CanonicalBone.LeftIndexDistal]: [/mixamorig.*:?lefthandindex3/i],
    [CanonicalBone.LeftMiddleProximal]: [/mixamorig.*:?lefthandmiddle1/i],
    [CanonicalBone.LeftMiddleIntermediate]: [/mixamorig.*:?lefthandmiddle2/i],
    [CanonicalBone.LeftMiddleDistal]: [/mixamorig.*:?lefthandmiddle3/i],
    [CanonicalBone.LeftRingProximal]: [/mixamorig.*:?lefthandring1/i],
    [CanonicalBone.LeftRingIntermediate]: [/mixamorig.*:?lefthandring2/i],
    [CanonicalBone.LeftRingDistal]: [/mixamorig.*:?lefthandring3/i],
    [CanonicalBone.LeftLittleProximal]: [/mixamorig.*:?lefthandpinky1/i],
    [CanonicalBone.LeftLittleIntermediate]: [/mixamorig.*:?lefthandpinky2/i],
    [CanonicalBone.LeftLittleDistal]: [/mixamorig.*:?lefthandpinky3/i],

    // Right Fingers
    [CanonicalBone.RightThumbMetacarpal]: [/mixamorig.*:?righthandthumb1/i],
    [CanonicalBone.RightThumbProximal]: [/mixamorig.*:?righthandthumb2/i],
    [CanonicalBone.RightThumbDistal]: [/mixamorig.*:?righthandthumb3/i],
    [CanonicalBone.RightIndexProximal]: [/mixamorig.*:?righthandindex1/i],
    [CanonicalBone.RightIndexIntermediate]: [/mixamorig.*:?righthandindex2/i],
    [CanonicalBone.RightIndexDistal]: [/mixamorig.*:?righthandindex3/i],
    [CanonicalBone.RightMiddleProximal]: [/mixamorig.*:?righthandmiddle1/i],
    [CanonicalBone.RightMiddleIntermediate]: [/mixamorig.*:?righthandmiddle2/i],
    [CanonicalBone.RightMiddleDistal]: [/mixamorig.*:?righthandmiddle3/i],
    [CanonicalBone.RightRingProximal]: [/mixamorig.*:?righthandring1/i],
    [CanonicalBone.RightRingIntermediate]: [/mixamorig.*:?righthandring2/i],
    [CanonicalBone.RightRingDistal]: [/mixamorig.*:?righthandring3/i],
    [CanonicalBone.RightLittleProximal]: [/mixamorig.*:?righthandpinky1/i],
    [CanonicalBone.RightLittleIntermediate]: [/mixamorig.*:?righthandpinky2/i],
    [CanonicalBone.RightLittleDistal]: [/mixamorig.*:?righthandpinky3/i],

    // Legs
    [CanonicalBone.LeftUpperLeg]: [/mixamorig.*:?leftupleg/i],
    [CanonicalBone.LeftLowerLeg]: [/mixamorig.*:?leftleg/i],
    [CanonicalBone.LeftFoot]: [/mixamorig.*:?leftfoot/i],
    [CanonicalBone.LeftToes]: [/mixamorig.*:?lefttoebase/i],
    [CanonicalBone.RightUpperLeg]: [/mixamorig.*:?rightupleg/i],
    [CanonicalBone.RightLowerLeg]: [/mixamorig.*:?rightleg/i],
    [CanonicalBone.RightFoot]: [/mixamorig.*:?rightfoot/i],
    [CanonicalBone.RightToes]: [/mixamorig.*:?righttoebase/i],
  };

  public static mapSkeleton(boneNames: string[]): Map<CanonicalBone, BoneMappingEntry> {
    const table = new Map<CanonicalBone, BoneMappingEntry>();

    for (const [canonicalStr, patterns] of Object.entries(this.MIXAMO_PATTERNS)) {
      const canonical = canonicalStr as CanonicalBone;
      for (const pattern of patterns) {
        const matched = boneNames.find(name => pattern.test(name));
        if (matched) {
          table.set(canonical, {
            canonical,
            sourceBoneName: matched,
            confidence: 0.98,
            isManualOverride: false,
          });
          break;
        }
      }
    }

    return table;
  }
}
