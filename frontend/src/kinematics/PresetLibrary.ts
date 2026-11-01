import { Joint28 } from '../rig/CanonicalSkeleton';

export interface PoseAngles {
  [joint: string]: [number, number, number]; // [X, Y, Z] degrees
}

export const ATOMIC_POSE_PRESETS: Record<string, PoseAngles> = {
  neutral: {
    spine_01: [0, 0, 0],
    neck: [0, 0, 0],
    head: [0, 0, 0],
    upper_arm_L: [10, 0, 8],
    upper_arm_R: [10, 0, -8],
    lower_arm_L: [15, 0, 0],
    lower_arm_R: [15, 0, 0],
  },
  listening_attentive: {
    spine_01: [4, 0, 0],
    spine_02: [3, 0, 0],
    neck: [5, -4, 5],
    head: [3, -2, 3],
    upper_arm_L: [8, 0, 5],
    upper_arm_R: [8, 0, -5],
  },
  hand_up_ack: {
    neck: [6, -10, 3],
    upper_arm_R: [48, -15, -38],
    lower_arm_R: [72, 0, 0],
    hand_R: [10, 5, 0],
    index_R: [0, 0, 0],
  },
  finger_up_insight: {
    spine_01: [5, 8, 0],
    neck: [-4, -6, 0],
    head: [-2, -4, 0],
    upper_arm_L: [55, 20, 35],
    lower_arm_L: [85, 0, 0],
    hand_L: [-12, 0, 0],
  },
  thinking_chin_touch: {
    neck: [-8, -12, 6],
    head: [-10, -8, 4],
    upper_arm_R: [75, -20, -35],
    lower_arm_R: [110, 0, 0],
  },
  terminal_summon: {
    upper_arm_L: [60, 30, 40],
    lower_arm_L: [90, 0, 20],
    hand_L: [0, 15, -10],
    head: [12, 15, -4],
  },
  self_heal: {
    spine_01: [-6, 0, 0],
    upper_arm_L: [35, 25, 40],
    upper_arm_R: [35, -25, -40],
    lower_arm_L: [45, 0, 0],
    lower_arm_R: [45, 0, 0],
  },
};
