import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import { DefaultAvatarGenerator } from '../src/rig/DefaultAvatarGenerator';
import { BoneRetargeter } from '../src/rig/BoneRetargeter';
import { MorphBlendshapeDriver } from '../src/audio/MorphBlendshapeDriver';
import { MotionBlendEngine } from '../src/kinematics/MotionBlendEngine';
import { CanonicalBone } from '../src/rig/canonicalBones';
import { VisemeName, ZERO_VISEME_WEIGHTS } from '../src/audio/visemeTypes';

describe('End-to-End System Integration', () => {
  it('should generate default avatar and wire retargeter with motion engine', () => {
    // 1. Generate model
    const { model, mappingTable } = DefaultAvatarGenerator.createDefaultAvatar();
    expect(model.bones.size).toBeGreaterThan(10);
    expect(model.skinnedMeshes.length).toBe(1);

    // 2. Wire retargeter
    const retargeter = new BoneRetargeter(model.bones, mappingTable);
    expect(retargeter).toBeDefined();

    // 3. Motion Engine update
    const motionEngine = new MotionBlendEngine();
    const rotations = motionEngine.update(1.0, 1.0 / 60.0);

    // Verify all canonical rotations are valid unit quaternions
    for (const [canonical, q] of rotations.entries()) {
      expect(Number.isFinite(q.x)).toBe(true);
      expect(Number.isFinite(q.y)).toBe(true);
      expect(Number.isFinite(q.z)).toBe(true);
      expect(Number.isFinite(q.w)).toBe(true);
      expect(q.length()).toBeCloseTo(1.0, 3);

      retargeter.applyBoneRotation(canonical, q);
    }
  });

  it('should drive visemes through MorphBlendshapeDriver', () => {
    const { model } = DefaultAvatarGenerator.createDefaultAvatar();
    const driver = new MorphBlendshapeDriver(model.skinnedMeshes);

    const weights = { ...ZERO_VISEME_WEIGHTS, [VisemeName.aa]: 0.85 };
    driver.applyVisemes(weights);

    const mesh = model.skinnedMeshes[0];
    const aaIdx = mesh.morphTargetDictionary!['viseme_aa'];
    expect(mesh.morphTargetInfluences![aaIdx]).toBeCloseTo(0.85, 3);
  });
});
