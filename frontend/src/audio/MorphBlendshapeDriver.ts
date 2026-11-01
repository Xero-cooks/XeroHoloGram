import * as THREE from 'three';
import { VisemeName, VisemeWeights } from './visemeTypes';

export class MorphBlendshapeDriver {
  private skinnedMeshes: THREE.SkinnedMesh[];
  private jawBone: THREE.Bone | null = null;
  private hasFacialBlendshapes: boolean = false;
  private maxJawPitchRad: number = (16.0 * Math.PI) / 180.0;

  constructor(skinnedMeshes: THREE.SkinnedMesh[], jawBone?: THREE.Bone) {
    this.skinnedMeshes = skinnedMeshes;
    this.jawBone = jawBone || null;

    // Check if any mesh contains viseme morph targets
    for (const mesh of skinnedMeshes) {
      if (mesh.morphTargetDictionary) {
        for (const viseme of Object.values(VisemeName)) {
          if (viseme in mesh.morphTargetDictionary) {
            this.hasFacialBlendshapes = true;
            break;
          }
        }
      }
    }
  }

  public applyVisemes(weights: VisemeWeights): void {
    if (this.hasFacialBlendshapes) {
      // 1. Drive morph target influences
      for (const mesh of this.skinnedMeshes) {
        if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue;

        for (const [viseme, weight] of Object.entries(weights)) {
          const index = mesh.morphTargetDictionary[viseme];
          if (index !== undefined) {
            mesh.morphTargetInfluences[index] = weight;
          }
        }
      }
    } else if (this.jawBone) {
      // 2. Fallback: drive jaw bone pitch rotation based on open vowel energy (aa, oh, E)
      const openVowelEnergy = Math.max(
        weights[VisemeName.aa] || 0,
        weights[VisemeName.oh] || 0,
        (weights[VisemeName.E] || 0) * 0.7
      );

      const jawPitch = openVowelEnergy * this.maxJawPitchRad;
      this.jawBone.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), jawPitch);
    }
  }

  public reset(): void {
    for (const mesh of this.skinnedMeshes) {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences.fill(0);
      }
    }
    if (this.jawBone) {
      this.jawBone.quaternion.identity();
    }
  }
}
