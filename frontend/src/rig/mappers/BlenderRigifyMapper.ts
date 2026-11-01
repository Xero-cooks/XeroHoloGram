import { CanonicalBone, BoneMappingEntry } from '../canonicalBones';

export class BlenderRigifyMapper {
  private static readonly RIGIFY_PATTERNS: Record<CanonicalBone, RegExp[]> = {
    [CanonicalBone.Hips]: [/def-spine$/i, /def-hips/i, /pelvis/i],
    [CanonicalBone.Spine]: [/def-spine\.001/i, /spine/i],
    [CanonicalBone.Chest]: [/def-spine\.002/i, /chest/i],
    [CanonicalBone.UpperChest]: [/def-spine\.003/i, /upper.*chest/i],
    [CanonicalBone.Neck]: [/def-spine\.004/i, /neck/i],
    [CanonicalBone.Head]: [/def-spine\.005/i, /def-head/i, /^head/i],
    [CanonicalBone.LeftEye]: [/def-eye\.l/i, /eye.*l/i],
    [CanonicalBone.RightEye]: [/def-eye\.r/i, /eye.*r/i],
    [CanonicalBone.Jaw]: [/def-jaw/i, /jaw/i],

    // Arms
    [CanonicalBone.LeftShoulder]: [/def-shoulder\.l/i, /shoulder.*l/i, /clavicle.*l/i],
    [CanonicalBone.LeftUpperArm]: [/def-upper_arm\.l/i, /upper_?arm.*l/i],
    [CanonicalBone.LeftLowerArm]: [/def-forearm\.l/i, /forearm.*l/i, /lower_?arm.*l/i],
    [CanonicalBone.LeftHand]: [/def-hand\.l/i, /hand.*l/i],

    [CanonicalBone.RightShoulder]: [/def-shoulder\.r/i, /shoulder.*r/i, /clavicle.*r/i],
    [CanonicalBone.RightUpperArm]: [/def-upper_arm\.r/i, /upper_?arm.*r/i],
    [CanonicalBone.RightLowerArm]: [/def-forearm\.r/i, /forearm.*r/i, /lower_?arm.*r/i],
    [CanonicalBone.RightHand]: [/def-hand\.r/i, /hand.*r/i],

    // Fingers Left
    [CanonicalBone.LeftThumbMetacarpal]: [/def-thumb\.01\.l/i, /thumb.*1.*l/i],
    [CanonicalBone.LeftThumbProximal]: [/def-thumb\.02\.l/i, /thumb.*2.*l/i],
    [CanonicalBone.LeftThumbDistal]: [/def-thumb\.03\.l/i, /thumb.*3.*l/i],
    [CanonicalBone.LeftIndexProximal]: [/def-f_index\.01\.l/i, /index.*1.*l/i],
    [CanonicalBone.LeftIndexIntermediate]: [/def-f_index\.02\.l/i, /index.*2.*l/i],
    [CanonicalBone.LeftIndexDistal]: [/def-f_index\.03\.l/i, /index.*3.*l/i],
    [CanonicalBone.LeftMiddleProximal]: [/def-f_middle\.01\.l/i, /middle.*1.*l/i],
    [CanonicalBone.LeftMiddleIntermediate]: [/def-f_middle\.02\.l/i, /middle.*2.*l/i],
    [CanonicalBone.LeftMiddleDistal]: [/def-f_middle\.03\.l/i, /middle.*3.*l/i],
    [CanonicalBone.LeftRingProximal]: [/def-f_ring\.01\.l/i, /ring.*1.*l/i],
    [CanonicalBone.LeftRingIntermediate]: [/def-f_ring\.02\.l/i, /ring.*2.*l/i],
    [CanonicalBone.LeftRingDistal]: [/def-f_ring\.03\.l/i, /ring.*3.*l/i],
    [CanonicalBone.LeftLittleProximal]: [/def-f_pinky\.01\.l/i, /pinky.*1.*l/i],
    [CanonicalBone.LeftLittleIntermediate]: [/def-f_pinky\.02\.l/i, /pinky.*2.*l/i],
    [CanonicalBone.LeftLittleDistal]: [/def-f_pinky\.03\.l/i, /pinky.*3.*l/i],

    // Fingers Right
    [CanonicalBone.RightThumbMetacarpal]: [/def-thumb\.01\.r/i, /thumb.*1.*r/i],
    [CanonicalBone.RightThumbProximal]: [/def-thumb\.02\.r/i, /thumb.*2.*r/i],
    [CanonicalBone.RightThumbDistal]: [/def-thumb\.03\.r/i, /thumb.*3.*r/i],
    [CanonicalBone.RightIndexProximal]: [/def-f_index\.01\.r/i, /index.*1.*r/i],
    [CanonicalBone.RightIndexIntermediate]: [/def-f_index\.02\.r/i, /index.*2.*r/i],
    [CanonicalBone.RightIndexDistal]: [/def-f_index\.03\.r/i, /index.*3.*r/i],
    [CanonicalBone.RightMiddleProximal]: [/def-f_middle\.01\.r/i, /middle.*1.*r/i],
    [CanonicalBone.RightMiddleIntermediate]: [/def-f_middle\.02\.r/i, /middle.*2.*r/i],
    [CanonicalBone.RightMiddleDistal]: [/def-f_middle\.03\.r/i, /middle.*3.*r/i],
    [CanonicalBone.RightRingProximal]: [/def-f_ring\.01\.r/i, /ring.*1.*r/i],
    [CanonicalBone.RightRingIntermediate]: [/def-f_ring\.02\.r/i, /ring.*2.*r/i],
    [CanonicalBone.RightRingDistal]: [/def-f_ring\.03\.r/i, /ring.*3.*r/i],
    [CanonicalBone.RightLittleProximal]: [/def-f_pinky\.01\.r/i, /pinky.*1.*r/i],
    [CanonicalBone.RightLittleIntermediate]: [/def-f_pinky\.02\.r/i, /pinky.*2.*r/i],
    [CanonicalBone.RightLittleDistal]: [/def-f_pinky\.03\.r/i, /pinky.*3.*r/i],

    // Legs
    [CanonicalBone.LeftUpperLeg]: [/def-thigh\.l/i, /thigh.*l/i, /upper_?leg.*l/i],
    [CanonicalBone.LeftLowerLeg]: [/def-shin\.l/i, /shin.*l/i, /lower_?leg.*l/i, /calf.*l/i],
    [CanonicalBone.LeftFoot]: [/def-foot\.l/i, /foot.*l/i],
    [CanonicalBone.LeftToes]: [/def-toe\.l/i, /toe.*l/i],

    [CanonicalBone.RightUpperLeg]: [/def-thigh\.r/i, /thigh.*r/i, /upper_?leg.*r/i],
    [CanonicalBone.RightLowerLeg]: [/def-shin\.r/i, /shin.*r/i, /lower_?leg.*r/i, /calf.*r/i],
    [CanonicalBone.RightFoot]: [/def-foot\.r/i, /foot.*r/i],
    [CanonicalBone.RightToes]: [/def-toe\.r/i, /toe.*r/i],
  };

  public static mapSkeleton(boneNames: string[]): Map<CanonicalBone, BoneMappingEntry> {
    const table = new Map<CanonicalBone, BoneMappingEntry>();

    for (const [canonicalStr, patterns] of Object.entries(this.RIGIFY_PATTERNS)) {
      const canonical = canonicalStr as CanonicalBone;
      for (const pattern of patterns) {
        const matched = boneNames.find(name => pattern.test(name));
        if (matched) {
          table.set(canonical, {
            canonical,
            sourceBoneName: matched,
            confidence: 0.95,
            isManualOverride: false,
          });
          break;
        }
      }
    }

    return table;
  }
}
