import { describe, expect, it } from 'bun:test';
import { CanonicalBone } from '../src/rig/canonicalBones';
import { MixamoMapper } from '../src/rig/mappers/MixamoMapper';
import { VRMMapper } from '../src/rig/mappers/VRMMapper';
import { UnrealEngineMapper } from '../src/rig/mappers/UnrealEngineMapper';
import { BlenderRigifyMapper } from '../src/rig/mappers/BlenderRigifyMapper';
import { BoneHierarchyTree } from '../src/studio/BoneHierarchyTree';
import { BonePresetManager } from '../src/studio/BonePresetManager';

describe('Mixamo Bone Mapper', () => {
  it('should accurately map typical Mixamo skeleton bone names', () => {
    const rawMixamoBones = [
      'mixamorig:Hips',
      'mixamorig:Spine',
      'mixamorig:Spine1',
      'mixamorig:Spine2',
      'mixamorig:Neck',
      'mixamorig:Head',
      'mixamorig:LeftArm',
      'mixamorig:LeftForeArm',
      'mixamorig:LeftHand',
      'mixamorig:RightArm',
      'mixamorig:RightForeArm',
      'mixamorig:RightHand',
      'mixamorig:LeftUpLeg',
      'mixamorig:LeftLeg',
      'mixamorig:LeftFoot',
      'mixamorig:RightUpLeg',
      'mixamorig:RightLeg',
      'mixamorig:RightFoot'
    ];

    const table = MixamoMapper.mapSkeleton(rawMixamoBones);

    expect(table.get(CanonicalBone.Hips)?.sourceBoneName).toBe('mixamorig:Hips');
    expect(table.get(CanonicalBone.Spine)?.sourceBoneName).toBe('mixamorig:Spine');
    expect(table.get(CanonicalBone.Chest)?.sourceBoneName).toBe('mixamorig:Spine1');
    expect(table.get(CanonicalBone.UpperChest)?.sourceBoneName).toBe('mixamorig:Spine2');
    expect(table.get(CanonicalBone.Head)?.sourceBoneName).toBe('mixamorig:Head');
    expect(table.get(CanonicalBone.LeftUpperArm)?.sourceBoneName).toBe('mixamorig:LeftArm');
    expect(table.get(CanonicalBone.RightUpperArm)?.sourceBoneName).toBe('mixamorig:RightArm');
    expect(table.get(CanonicalBone.LeftFoot)?.sourceBoneName).toBe('mixamorig:LeftFoot');
  });
});

describe('VRM Humanoid Mapper', () => {
  it('should map J_Bip standard VRM bone names', () => {
    const rawVRMBones = [
      'J_Bip_C_Hips',
      'J_Bip_C_Spine',
      'J_Bip_C_Chest',
      'J_Bip_C_UpperChest',
      'J_Bip_C_Neck',
      'J_Bip_C_Head',
      'J_Bip_L_UpperArm',
      'J_Bip_L_LowerArm',
      'J_Bip_L_Hand',
      'J_Bip_R_UpperArm',
      'J_Bip_R_LowerArm',
      'J_Bip_R_Hand'
    ];

    const table = VRMMapper.mapSkeleton(rawVRMBones);

    expect(table.get(CanonicalBone.Hips)?.sourceBoneName).toBe('J_Bip_C_Hips');
    expect(table.get(CanonicalBone.Neck)?.sourceBoneName).toBe('J_Bip_C_Neck');
    expect(table.get(CanonicalBone.Head)?.sourceBoneName).toBe('J_Bip_C_Head');
    expect(table.get(CanonicalBone.LeftUpperArm)?.sourceBoneName).toBe('J_Bip_L_UpperArm');
  });
});

describe('Unreal Engine Manny/Quinn Mapper', () => {
  it('should map pelvis, spine, and clavicle conventions', () => {
    const rawUEBones = [
      'pelvis',
      'spine_01',
      'spine_02',
      'spine_03',
      'neck_01',
      'head',
      'clavicle_l',
      'upperarm_l',
      'lowerarm_l',
      'hand_l',
      'thigh_l',
      'calf_l',
      'foot_l'
    ];

    const table = UnrealEngineMapper.mapSkeleton(rawUEBones);

    expect(table.get(CanonicalBone.Hips)?.sourceBoneName).toBe('pelvis');
    expect(table.get(CanonicalBone.Spine)?.sourceBoneName).toBe('spine_01');
    expect(table.get(CanonicalBone.Chest)?.sourceBoneName).toBe('spine_02');
    expect(table.get(CanonicalBone.LeftShoulder)?.sourceBoneName).toBe('clavicle_l');
    expect(table.get(CanonicalBone.LeftUpperArm)?.sourceBoneName).toBe('upperarm_l');
  });
});

describe('Blender Rigify Mapper', () => {
  it('should map DEF- prefix rigify deform bones', () => {
    const rawRigifyBones = [
      'DEF-spine',
      'DEF-spine.001',
      'DEF-spine.002',
      'DEF-spine.003',
      'DEF-spine.004',
      'DEF-spine.005',
      'DEF-upper_arm.L',
      'DEF-forearm.L',
      'DEF-hand.L'
    ];

    const table = BlenderRigifyMapper.mapSkeleton(rawRigifyBones);

    expect(table.get(CanonicalBone.Hips)?.sourceBoneName).toBe('DEF-spine');
    expect(table.get(CanonicalBone.Spine)?.sourceBoneName).toBe('DEF-spine.001');
    expect(table.get(CanonicalBone.Head)?.sourceBoneName).toBe('DEF-spine.005');
    expect(table.get(CanonicalBone.LeftUpperArm)?.sourceBoneName).toBe('DEF-upper_arm.L');
  });
});

describe('Bone Preset Manager & Audit', () => {
  it('should correctly audit coverage and roundtrip serialize JSON', () => {
    const sampleBones = ['mixamorig:Hips', 'mixamorig:Spine', 'mixamorig:Head'];
    const table = MixamoMapper.mapSkeleton(sampleBones);

    const audit = BoneHierarchyTree.auditMapping(table);
    expect(audit.mappedCount).toBe(3);
    expect(audit.coverageRatio).toBeGreaterThan(0.0);
    expect(audit.missingCriticalBones).toContain(CanonicalBone.Neck);

    const json = BonePresetManager.exportToJSON(table, 'TestModel');
    const imported = BonePresetManager.importFromJSON(json);

    expect(imported.get(CanonicalBone.Hips)?.sourceBoneName).toBe('mixamorig:Hips');
    expect(imported.get(CanonicalBone.Head)?.sourceBoneName).toBe('mixamorig:Head');
  });
});
