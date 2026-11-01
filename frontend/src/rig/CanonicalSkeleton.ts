/**
 * Canonical 28-Joint Agentic-Hologram Skeleton Schema
 */

export enum Joint28 {
  pelvis = 'pelvis',
  spine_01 = 'spine_01',
  spine_02 = 'spine_02',
  neck = 'neck',
  head = 'head',
  jaw = 'jaw',
  clavicle_L = 'clavicle_L',
  clavicle_R = 'clavicle_R',
  upper_arm_L = 'upper_arm_L',
  upper_arm_R = 'upper_arm_R',
  lower_arm_L = 'lower_arm_L',
  lower_arm_R = 'lower_arm_R',
  hand_L = 'hand_L',
  hand_R = 'hand_R',
  thumb_L = 'thumb_L',
  thumb_R = 'thumb_R',
  index_L = 'index_L',
  index_R = 'index_R',
  middle_L = 'middle_L',
  middle_R = 'middle_R',
  ring_L = 'ring_L',
  ring_R = 'ring_R',
  pinky_L = 'pinky_L',
  pinky_R = 'pinky_R',
  upper_leg_L = 'upper_leg_L',
  upper_leg_R = 'upper_leg_R',
  lower_leg_L = 'lower_leg_L',
  lower_leg_R = 'lower_leg_R',
}

export const JOINT_28_PARENTS: Partial<Record<Joint28, Joint28>> = {
  [Joint28.spine_01]: Joint28.pelvis,
  [Joint28.spine_02]: Joint28.spine_01,
  [Joint28.neck]: Joint28.spine_02,
  [Joint28.head]: Joint28.neck,
  [Joint28.jaw]: Joint28.head,

  [Joint28.clavicle_L]: Joint28.spine_02,
  [Joint28.upper_arm_L]: Joint28.clavicle_L,
  [Joint28.lower_arm_L]: Joint28.upper_arm_L,
  [Joint28.hand_L]: Joint28.lower_arm_L,
  [Joint28.thumb_L]: Joint28.hand_L,
  [Joint28.index_L]: Joint28.hand_L,
  [Joint28.middle_L]: Joint28.hand_L,
  [Joint28.ring_L]: Joint28.hand_L,
  [Joint28.pinky_L]: Joint28.hand_L,

  [Joint28.clavicle_R]: Joint28.spine_02,
  [Joint28.upper_arm_R]: Joint28.clavicle_R,
  [Joint28.lower_arm_R]: Joint28.upper_arm_R,
  [Joint28.hand_R]: Joint28.lower_arm_R,
  [Joint28.thumb_R]: Joint28.hand_R,
  [Joint28.index_R]: Joint28.hand_R,
  [Joint28.middle_R]: Joint28.hand_R,
  [Joint28.ring_R]: Joint28.hand_R,
  [Joint28.pinky_R]: Joint28.hand_R,

  [Joint28.upper_leg_L]: Joint28.pelvis,
  [Joint28.lower_leg_L]: Joint28.upper_leg_L,

  [Joint28.upper_leg_R]: Joint28.pelvis,
  [Joint28.lower_leg_R]: Joint28.upper_leg_R,
};
