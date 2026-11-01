import * as THREE from 'three';

export interface IngestedRig {
  root: THREE.Group;
  bones: Map<string, THREE.Bone>;
  bindMatrices: Map<string, THREE.Matrix4>;
  morphTargetDictionary: Record<string, number>;
  skinnedMeshes: THREE.SkinnedMesh[];
}

export class RigLoader {
  /**
   * Parses and extracts skeletal bind matrices and morph targets from an uploaded 3D group
   */
  public static ingestModel(modelRoot: THREE.Group): IngestedRig {
    const bones = new Map<string, THREE.Bone>();
    const bindMatrices = new Map<string, THREE.Matrix4>();
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    let morphDict: Record<string, number> = {};

    modelRoot.traverse((node: THREE.Object3D) => {
      if ((node as THREE.Bone).isBone) {
        const bone = node as THREE.Bone;
        bones.set(bone.name, bone);
        bindMatrices.set(bone.name, bone.matrix.clone());
      }

      if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = node as THREE.SkinnedMesh;
        skinnedMeshes.push(mesh);
        if (mesh.morphTargetDictionary) {
          morphDict = { ...morphDict, ...mesh.morphTargetDictionary };
        }
      }
    });

    return {
      root: modelRoot,
      bones,
      bindMatrices,
      morphTargetDictionary: morphDict,
      skinnedMeshes,
    };
  }
}
