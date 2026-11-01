import { Joint28 } from '../rig/CanonicalSkeleton';
import { ATOMIC_POSE_PRESETS, PoseAngles } from './PresetLibrary';

export class PoseBlender {
  /**
   * Combines base preset angles with dynamic D3 angle overrides
   */
  public static blendPose(
    basePresetName: string,
    overrides: Record<string, [number, number, number]>,
    blendWeight: number = 1.0
  ): Map<Joint28, [number, number, number]> {
    const result = new Map<Joint28, [number, number, number]>();
    const basePose = ATOMIC_POSE_PRESETS[basePresetName] || ATOMIC_POSE_PRESETS.neutral;

    // Apply base preset
    for (const [jointStr, angles] of Object.entries(basePose)) {
      if (jointStr in Joint28) {
        result.set(jointStr as Joint28, [...angles]);
      }
    }

    // Blend overrides
    for (const [jointStr, overrideAngles] of Object.entries(overrides)) {
      if (jointStr in Joint28) {
        const j = jointStr as Joint28;
        const base = result.get(j) || [0, 0, 0];
        const blended: [number, number, number] = [
          base[0] * (1.0 - blendWeight) + overrideAngles[0] * blendWeight,
          base[1] * (1.0 - blendWeight) + overrideAngles[1] * blendWeight,
          base[2] * (1.0 - blendWeight) + overrideAngles[2] * blendWeight,
        ];
        result.set(j, blended);
      }
    }

    return result;
  }
}
