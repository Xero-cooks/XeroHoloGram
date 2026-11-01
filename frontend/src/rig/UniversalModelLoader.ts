import * as THREE from 'three';

export interface LoadedRiggedModel {
  root: THREE.Group;
  bones: Map<string, THREE.Bone>;
  skinnedMeshes: THREE.SkinnedMesh[];
  morphTargetDictionary: Record<string, number>;
  rawBoneNames: string[];
}

export class UniversalModelLoader {
  /**
   * Parses and inspects an existing Three.js Group/Scene loaded from GLTF/GLB
   */
  public static inspectModel(modelRoot: THREE.Group): LoadedRiggedModel {
    const bones = new Map<string, THREE.Bone>();
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    let morphDict: Record<string, number> = {};
    const rawBoneNames: string[] = [];

    modelRoot.traverse((node: THREE.Object3D) => {
      if ((node as THREE.Bone).isBone) {
        const bone = node as THREE.Bone;
        bones.set(bone.name, bone);
        rawBoneNames.push(bone.name);
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
      skinnedMeshes,
      morphTargetDictionary: morphDict,
      rawBoneNames,
    };
  }

  /**
   * Applies custom holographic rim material to all meshes while preserving skinning weights
   */
  public static applyHologramMaterial(
    model: LoadedRiggedModel,
    hologramShaderMaterial: THREE.ShaderMaterial
  ): void {
    for (const mesh of model.skinnedMeshes) {
      const clonedMaterial = hologramShaderMaterial.clone();
      // Ensure skinning attributes are handled by Three.js shader chunk
      clonedMaterial.skinning = true;
      clonedMaterial.transparent = true;
      clonedMaterial.depthWrite = false;
      mesh.material = clonedMaterial;
    }
  }
}
