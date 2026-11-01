/**
 * Canonical 55-Bone Humanoid Skeleton Specification
 * Standardizes skeletal topology across arbitrary 3D model formats.
 */

export enum CanonicalBone {
  // Core & Spine (9 bones)
  Hips = 'Hips',
  Spine = 'Spine',
  Chest = 'Chest',
  UpperChest = 'UpperChest',
  Neck = 'Neck',
  Head = 'Head',
  LeftEye = 'LeftEye',
  RightEye = 'RightEye',
  Jaw = 'Jaw',

  // Left Arm (4 bones)
  LeftShoulder = 'LeftShoulder',
  LeftUpperArm = 'LeftUpperArm',
  LeftLowerArm = 'LeftLowerArm',
  LeftHand = 'LeftHand',

  // Right Arm (4 bones)
  RightShoulder = 'RightShoulder',
  RightUpperArm = 'RightUpperArm',
  RightLowerArm = 'RightLowerArm',
  RightHand = 'RightHand',

  // Left Hand Fingers (15 bones: 5 fingers * 3 joints)
  LeftThumbMetacarpal = 'LeftThumbMetacarpal',
  LeftThumbProximal = 'LeftThumbProximal',
  LeftThumbDistal = 'LeftThumbDistal',
  LeftIndexProximal = 'LeftIndexProximal',
  LeftIndexIntermediate = 'LeftIndexIntermediate',
  LeftIndexDistal = 'LeftIndexDistal',
  LeftMiddleProximal = 'LeftMiddleProximal',
  LeftMiddleIntermediate = 'LeftMiddleIntermediate',
  LeftMiddleDistal = 'LeftMiddleDistal',
  LeftRingProximal = 'LeftRingProximal',
  LeftRingIntermediate = 'LeftRingIntermediate',
  LeftRingDistal = 'LeftRingDistal',
  LeftLittleProximal = 'LeftLittleProximal',
  LeftLittleIntermediate = 'LeftLittleIntermediate',
  LeftLittleDistal = 'LeftLittleDistal',

  // Right Hand Fingers (15 bones: 5 fingers * 3 joints)
  RightThumbMetacarpal = 'RightThumbMetacarpal',
  RightThumbProximal = 'RightThumbProximal',
  RightThumbDistal = 'RightThumbDistal',
  RightIndexProximal = 'RightIndexProximal',
  RightIndexIntermediate = 'RightIndexIntermediate',
  RightIndexDistal = 'RightIndexDistal',
  RightMiddleProximal = 'RightMiddleProximal',
  RightMiddleIntermediate = 'RightMiddleIntermediate',
  RightMiddleDistal = 'RightMiddleDistal',
  RightRingProximal = 'RightRingProximal',
  RightRingIntermediate = 'RightRingIntermediate',
  RightRingDistal = 'RightRingDistal',
  RightLittleProximal = 'RightLittleProximal',
  RightLittleIntermediate = 'RightLittleIntermediate',
  RightLittleDistal = 'RightLittleDistal',

  // Lower Body (8 bones)
  LeftUpperLeg = 'LeftUpperLeg',
  LeftLowerLeg = 'LeftLowerLeg',
  LeftFoot = 'LeftFoot',
  LeftToes = 'LeftToes',
  RightUpperLeg = 'RightUpperLeg',
  RightLowerLeg = 'RightLowerLeg',
  RightFoot = 'RightFoot',
  RightToes = 'RightToes',
}

export const CANONICAL_BONE_PARENTS: Partial<Record<CanonicalBone, CanonicalBone>> = {
  [CanonicalBone.Spine]: CanonicalBone.Hips,
  [CanonicalBone.Chest]: CanonicalBone.Spine,
  [CanonicalBone.UpperChest]: CanonicalBone.Chest,
  [CanonicalBone.Neck]: CanonicalBone.UpperChest,
  [CanonicalBone.Head]: CanonicalBone.Neck,
  [CanonicalBone.LeftEye]: CanonicalBone.Head,
  [CanonicalBone.RightEye]: CanonicalBone.Head,
  [CanonicalBone.Jaw]: CanonicalBone.Head,

  // Left Arm
  [CanonicalBone.LeftShoulder]: CanonicalBone.UpperChest,
  [CanonicalBone.LeftUpperArm]: CanonicalBone.LeftShoulder,
  [CanonicalBone.LeftLowerArm]: CanonicalBone.LeftUpperArm,
  [CanonicalBone.LeftHand]: CanonicalBone.LeftLowerArm,

  // Right Arm
  [CanonicalBone.RightShoulder]: CanonicalBone.UpperChest,
  [CanonicalBone.RightUpperArm]: CanonicalBone.RightShoulder,
  [CanonicalBone.RightLowerArm]: CanonicalBone.RightUpperArm,
  [CanonicalBone.RightHand]: CanonicalBone.RightLowerArm,

  // Legs
  [CanonicalBone.LeftUpperLeg]: CanonicalBone.Hips,
  [CanonicalBone.LeftLowerLeg]: CanonicalBone.LeftUpperLeg,
  [CanonicalBone.LeftFoot]: CanonicalBone.LeftLowerLeg,
  [CanonicalBone.LeftToes]: CanonicalBone.LeftFoot,

  [CanonicalBone.RightUpperLeg]: CanonicalBone.Hips,
  [CanonicalBone.RightLowerLeg]: CanonicalBone.RightUpperLeg,
  [CanonicalBone.RightFoot]: CanonicalBone.RightLowerLeg,
  [CanonicalBone.RightToes]: CanonicalBone.RightFoot,
};

export interface BoneMappingEntry {
  canonical: CanonicalBone;
  sourceBoneName: string;
  confidence: number; // 0.0 to 1.0
  isManualOverride: boolean;
}

export type BoneMappingTable = Map<CanonicalBone, BoneMappingEntry>;
