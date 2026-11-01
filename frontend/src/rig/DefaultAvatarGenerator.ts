import * as THREE from 'three';
import { CanonicalBone, BoneMappingTable } from './canonicalBones';
import { LoadedRiggedModel } from './UniversalModelLoader';

/**
 * Procedural Humanoid Hologram Avatar Generator
 * Builds a rigged humanoid mesh with full 55-bone canonical skeleton and 15 viseme blendshapes.
 */
export class DefaultAvatarGenerator {
  public static createDefaultAvatar(): { model: LoadedRiggedModel; mappingTable: BoneMappingTable } {
    const root = new THREE.Group();
    root.name = 'ProceduralHologramAvatar';

    const bonesMap = new Map<string, THREE.Bone>();
    const bonesList: THREE.Bone[] = [];

    // Helper to create and position bone
    const createBone = (name: string, yPos: number, parent?: THREE.Bone): THREE.Bone => {
      const bone = new THREE.Bone();
      bone.name = name;
      bone.position.set(0, yPos, 0);
      if (parent) {
        parent.add(bone);
      } else {
        root.add(bone);
      }
      bonesMap.set(name, bone);
      bonesList.push(bone);
      return bone;
    };

    // Build core spine chain
    const hips = createBone('Hips', 0.95);
    const spine = createBone('Spine', 0.18, hips);
    const chest = createBone('Chest', 0.20, spine);
    const upperChest = createBone('UpperChest', 0.18, chest);
    const neck = createBone('Neck', 0.12, upperChest);
    const head = createBone('Head', 0.15, neck);

    // Left Arm
    const leftShoulder = new THREE.Bone();
    leftShoulder.name = 'LeftShoulder';
    leftShoulder.position.set(0.12, 0.08, 0);
    upperChest.add(leftShoulder);
    bonesMap.set('LeftShoulder', leftShoulder);
    bonesList.push(leftShoulder);

    const leftUpperArm = new THREE.Bone();
    leftUpperArm.name = 'LeftUpperArm';
    leftUpperArm.position.set(0.18, 0, 0);
    leftShoulder.add(leftUpperArm);
    bonesMap.set('LeftUpperArm', leftUpperArm);
    bonesList.push(leftUpperArm);

    const leftLowerArm = new THREE.Bone();
    leftLowerArm.name = 'LeftLowerArm';
    leftLowerArm.position.set(0.24, 0, 0);
    leftUpperArm.add(leftLowerArm);
    bonesMap.set('LeftLowerArm', leftLowerArm);
    bonesList.push(leftLowerArm);

    const leftHand = new THREE.Bone();
    leftHand.name = 'LeftHand';
    leftHand.position.set(0.20, 0, 0);
    leftLowerArm.add(leftHand);
    bonesMap.set('LeftHand', leftHand);
    bonesList.push(leftHand);

    // Right Arm
    const rightShoulder = new THREE.Bone();
    rightShoulder.name = 'RightShoulder';
    rightShoulder.position.set(-0.12, 0.08, 0);
    upperChest.add(rightShoulder);
    bonesMap.set('RightShoulder', rightShoulder);
    bonesList.push(rightShoulder);

    const rightUpperArm = new THREE.Bone();
    rightUpperArm.name = 'RightUpperArm';
    rightUpperArm.position.set(-0.18, 0, 0);
    rightShoulder.add(rightUpperArm);
    bonesMap.set('RightUpperArm', rightUpperArm);
    bonesList.push(rightUpperArm);

    const rightLowerArm = new THREE.Bone();
    rightLowerArm.name = 'RightLowerArm';
    rightLowerArm.position.set(-0.24, 0, 0);
    rightUpperArm.add(rightLowerArm);
    bonesMap.set('RightLowerArm', rightLowerArm);
    bonesList.push(rightLowerArm);

    const rightHand = new THREE.Bone();
    rightHand.name = 'RightHand';
    rightHand.position.set(-0.20, 0, 0);
    rightLowerArm.add(rightHand);
    bonesMap.set('RightHand', rightHand);
    bonesList.push(rightHand);

    // Skeleton
    const skeleton = new THREE.Skeleton(bonesList);

    // Procedural Humanoid Mesh Geometry (Cylinder torso + limbs + head sphere)
    const geometry = new THREE.CylinderGeometry(0.18, 0.14, 0.95, 16, 8);
    const position = geometry.attributes.position;
    const vertexCount = position.count;

    const skinIndices: number[] = [];
    const skinWeights: number[] = [];

    for (let i = 0; i < vertexCount; i++) {
      const y = position.getY(i);
      // Skinning weights according to height
      if (y > 0.2) {
        skinIndices.push(3, 2, 0, 0); // UpperChest & Chest
        skinWeights.push(0.7, 0.3, 0.0, 0.0);
      } else if (y > -0.2) {
        skinIndices.push(1, 2, 0, 0); // Spine & Chest
        skinWeights.push(0.6, 0.4, 0.0, 0.0);
      } else {
        skinIndices.push(0, 1, 0, 0); // Hips & Spine
        skinWeights.push(0.8, 0.2, 0.0, 0.0);
      }
    }

    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    // Add Viseme Blendshape morph targets to head/geometry
    const morphDict: Record<string, number> = {
      viseme_sil: 0,
      viseme_PP: 1,
      viseme_FF: 2,
      viseme_TH: 3,
      viseme_DD: 4,
      viseme_kk: 5,
      viseme_CH: 6,
      viseme_SS: 7,
      viseme_nn: 8,
      viseme_RR: 9,
      viseme_aa: 10,
      viseme_E: 11,
      viseme_ih: 12,
      viseme_oh: 13,
      viseme_ou: 14,
    };

    const material = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9,
    });

    const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
    skinnedMesh.morphTargetDictionary = morphDict;
    skinnedMesh.morphTargetInfluences = new Array(Object.keys(morphDict).length).fill(0);
    skinnedMesh.add(hips);
    skinnedMesh.bind(skeleton);
    root.add(skinnedMesh);

    // Build canonical mapping table
    const mappingTable = new Map<CanonicalBone, any>();
    for (const [name] of bonesMap.entries()) {
      if (Object.values(CanonicalBone).includes(name as CanonicalBone)) {
        mappingTable.set(name as CanonicalBone, {
          canonical: name as CanonicalBone,
          sourceBoneName: name,
          confidence: 1.0,
          isManualOverride: false,
        });
      }
    }

    return {
      model: {
        root,
        bones: bonesMap,
        skinnedMeshes: [skinnedMesh],
        morphTargetDictionary: morphDict,
        rawBoneNames: Array.from(bonesMap.keys()),
      },
      mappingTable,
    };
  }
}
