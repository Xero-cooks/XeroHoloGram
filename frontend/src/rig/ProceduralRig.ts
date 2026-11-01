import * as THREE from 'three';
import { Joint28, JOINT_28_PARENTS } from './CanonicalSkeleton';

export interface XeroKratosRig {
  root: THREE.Group;
  bones: Map<Joint28, THREE.Bone>;
  skinnedMesh: THREE.SkinnedMesh;
  reactorCore: THREE.Mesh;
  visorMesh: THREE.Mesh;
  jawBone: THREE.Bone;
  updateReactorPulse: (voiceRms: number, delta: number) => void;
}

export class ProceduralRig {
  public static createXeroKratos(): XeroKratosRig {
    const root = new THREE.Group();
    root.name = 'XeroKratos-Default';

    const bones = new Map<Joint28, THREE.Bone>();
    const bonesList: THREE.Bone[] = [];

    // Helper to spawn joint
    const makeBone = (joint: Joint28, pos: [number, number, number], parent?: THREE.Bone): THREE.Bone => {
      const bone = new THREE.Bone();
      bone.name = joint;
      bone.position.set(...pos);
      if (parent) {
        parent.add(bone);
      } else {
        root.add(bone);
      }
      bones.set(joint, bone);
      bonesList.push(bone);
      return bone;
    };

    // 1. Build 28-joint canonical skeleton
    const pelvis = makeBone(Joint28.pelvis, [0, 0.95, 0]);
    const spine01 = makeBone(Joint28.spine_01, [0, 0.16, 0], pelvis);
    const spine02 = makeBone(Joint28.spine_02, [0, 0.20, 0], spine01);
    const neck = makeBone(Joint28.neck, [0, 0.18, 0], spine02);
    const head = makeBone(Joint28.head, [0, 0.14, 0], neck);
    const jaw = makeBone(Joint28.jaw, [0, -0.06, 0.08], head);

    // Left Arm Chain
    const clavicleL = makeBone(Joint28.clavicle_L, [0.10, 0.12, 0], spine02);
    const upperArmL = makeBone(Joint28.upper_arm_L, [0.18, 0, 0], clavicleL);
    const lowerArmL = makeBone(Joint28.lower_arm_L, [0.24, 0, 0], upperArmL);
    const handL = makeBone(Joint28.hand_L, [0.20, 0, 0], lowerArmL);
    const thumbL = makeBone(Joint28.thumb_L, [0.04, 0.02, 0.03], handL);
    const indexL = makeBone(Joint28.index_L, [0.06, 0.01, 0.01], handL);
    const middleL = makeBone(Joint28.middle_L, [0.06, 0.0, 0.0], handL);
    const ringL = makeBone(Joint28.ring_L, [0.06, -0.01, -0.01], handL);
    const pinkyL = makeBone(Joint28.pinky_L, [0.05, -0.02, -0.02], handL);

    // Right Arm Chain
    const clavicleR = makeBone(Joint28.clavicle_R, [-0.10, 0.12, 0], spine02);
    const upperArmR = makeBone(Joint28.upper_arm_R, [-0.18, 0, 0], clavicleR);
    const lowerArmR = makeBone(Joint28.lower_arm_R, [-0.24, 0, 0], upperArmR);
    const handR = makeBone(Joint28.hand_R, [-0.20, 0, 0], lowerArmR);
    const thumbR = makeBone(Joint28.thumb_R, [-0.04, 0.02, 0.03], handR);
    const indexR = makeBone(Joint28.index_R, [-0.06, 0.01, 0.01], handR);
    const middleR = makeBone(Joint28.middle_R, [-0.06, 0.0, 0.0], handR);
    const ringR = makeBone(Joint28.ring_R, [-0.06, -0.01, -0.01], handR);
    const pinkyR = makeBone(Joint28.pinky_R, [-0.05, -0.02, -0.02], handR);

    // Legs
    const upperLegL = makeBone(Joint28.upper_leg_L, [0.12, -0.05, 0], pelvis);
    const lowerLegL = makeBone(Joint28.lower_leg_L, [0, -0.42, 0], upperLegL);
    const upperLegR = makeBone(Joint28.upper_leg_R, [-0.12, -0.05, 0], pelvis);
    const lowerLegR = makeBone(Joint28.lower_leg_R, [0, -0.42, 0], upperLegR);

    // Skeleton
    const skeleton = new THREE.Skeleton(bonesList);

    // 2. Procedural Sci-Fi Skinned Torso & Limbs
    const geometry = new THREE.CylinderGeometry(0.19, 0.13, 0.95, 20, 10);
    const pos = geometry.attributes.position;
    const skinIndices: number[] = [];
    const skinWeights: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0.25) {
        skinIndices.push(2, 1, 0, 0); // spine_02 & spine_01
        skinWeights.push(0.75, 0.25, 0.0, 0.0);
      } else if (y > -0.15) {
        skinIndices.push(1, 2, 0, 0); // spine_01 & spine_02
        skinWeights.push(0.65, 0.35, 0.0, 0.0);
      } else {
        skinIndices.push(0, 1, 0, 0); // pelvis
        skinWeights.push(0.85, 0.15, 0.0, 0.0);
      }
    }

    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x062030,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88,
    });

    const skinnedMesh = new THREE.SkinnedMesh(geometry, bodyMat);
    skinnedMesh.add(pelvis);
    skinnedMesh.bind(skeleton);
    root.add(skinnedMesh);

    // 3. Glowing Cybernetic Visor on Head
    const visorGeo = new THREE.BoxGeometry(0.18, 0.04, 0.12);
    const visorMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.95,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.04, 0.10);
    head.add(visorMesh);

    // 4. Rotating Octahedron Reactor Core (synced to voice amplitude)
    const reactorGeo = new THREE.OctahedronGeometry(0.065, 0);
    const reactorMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const reactorCore = new THREE.Mesh(reactorGeo, reactorMat);
    reactorCore.position.set(0, 0.02, 0.12); // Mounted in center of chest
    spine02.add(reactorCore);

    // Pulse updater function
    const updateReactorPulse = (voiceRms: number, delta: number) => {
      reactorCore.rotation.y += (1.5 + voiceRms * 8.0) * delta;
      reactorCore.rotation.x += (0.8 + voiceRms * 5.0) * delta;

      const scale = 1.0 + Math.min(voiceRms * 1.8, 0.7);
      reactorCore.scale.set(scale, scale, scale);

      const glowColor = (visorMesh.material as THREE.MeshBasicMaterial).color;
      glowColor.setRGB(voiceRms * 0.5, 0.85 + voiceRms * 0.15, 1.0);
    };

    return {
      root,
      bones,
      skinnedMesh,
      reactorCore,
      visorMesh,
      jawBone: jaw,
      updateReactorPulse,
    };
  }
}
