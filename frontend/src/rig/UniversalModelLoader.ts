import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { BoneAutoMapper } from './BoneAutoMapper';
import { Joint28 } from './CanonicalSkeleton';

export interface LoadedRiggedModel {
  root: THREE.Group;
  bones: Map<string, THREE.Bone>;
  canonicalJointMap?: Map<Joint28, THREE.Bone>;
  skinnedMeshes: THREE.SkinnedMesh[];
  morphTargetDictionary: Record<string, number>;
  rawBoneNames: string[];
  stats?: {
    triangleCount: number;
    meshCount: number;
    boneCount: number;
    isRigged: boolean;
  };
}

export class UniversalModelLoader {
  /**
   * Loads and normalizes arbitrary 3D model files (.glb, .gltf, .vrm, .obj) in-memory
   */
  public static async loadFromFile(file: File): Promise<LoadedRiggedModel> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (ext === 'glb' || ext === 'gltf' || ext === 'vrm') {
      const buffer = await file.arrayBuffer();
      return this.loadGLTFBuffer(buffer, file.name);
    } else if (ext === 'obj') {
      const text = await file.text();
      return this.loadOBJText(text, file.name);
    } else {
      throw new Error(`Unsupported model format .${ext}. Please upload .glb, .gltf, .vrm, or .obj.`);
    }
  }

  /**
   * Parses GLTF / GLB / VRM binary array buffer
   */
  public static loadGLTFBuffer(buffer: ArrayBuffer, filename: string): Promise<LoadedRiggedModel> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.parse(
        buffer,
        '',
        (gltf) => {
          const root = gltf.scene || gltf.scenes[0];
          root.name = filename;
          const inspected = this.inspectAndNormalizeModel(root);
          resolve(inspected);
        },
        (error) => {
          reject(new Error(`Failed to parse GLTF/VRM: ${error.message}`));
        }
      );
    });
  }

  /**
   * Parses Wavefront OBJ text content
   */
  public static loadOBJText(text: string, filename: string): LoadedRiggedModel {
    const loader = new OBJLoader();
    const group = loader.parse(text);
    group.name = filename;
    return this.inspectAndNormalizeModel(group);
  }

  /**
   * Parses and inspects an existing Three.js Group/Scene
   */
  public static inspectAndNormalizeModel(modelRoot: THREE.Group): LoadedRiggedModel {
    const bones = new Map<string, THREE.Bone>();
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    let morphDict: Record<string, number> = {};
    const rawBoneNames: string[] = [];
    let totalTriangles = 0;
    let meshCount = 0;

    modelRoot.traverse((node: THREE.Object3D) => {
      if ((node as THREE.Bone).isBone) {
        const bone = node as THREE.Bone;
        bones.set(bone.name, bone);
        rawBoneNames.push(bone.name);
      }

      if ((node as THREE.Mesh).isMesh) {
        meshCount++;
        const mesh = node as THREE.Mesh;
        if (mesh.geometry) {
          const index = mesh.geometry.index;
          if (index) {
            totalTriangles += index.count / 3;
          } else if (mesh.geometry.attributes.position) {
            totalTriangles += mesh.geometry.attributes.position.count / 3;
          }
        }
      }

      if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
        const skinned = node as THREE.SkinnedMesh;
        skinnedMeshes.push(skinned);
        if (skinned.morphTargetDictionary) {
          morphDict = { ...morphDict, ...skinned.morphTargetDictionary };
        }
      }
    });

    // Automatically normalize scale to human height ~1.75m and stand on ground (Y=0)
    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.y, size.x, size.z, 0.001);
    if (maxDim > 0.05 && maxDim < 1000) {
      const targetHeight = 1.75;
      const scale = targetHeight / (size.y || 1.75);
      modelRoot.scale.setScalar(scale);

      // Re-evaluate bounding box after scale
      const scaledBox = new THREE.Box3().setFromObject(modelRoot);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      modelRoot.position.x = -scaledCenter.x;
      modelRoot.position.y = -scaledBox.min.y;
      modelRoot.position.z = -scaledCenter.z;
    }

    // Auto-map bones to Canonical 28 joints using BoneAutoMapper
    const mappingTable = BoneAutoMapper.autoMapBones(rawBoneNames);
    const canonicalJointMap = new Map<Joint28, THREE.Bone>();

    for (const [canonical, entry] of mappingTable.entries()) {
      if (entry.matchedBoneName && bones.has(entry.matchedBoneName)) {
        canonicalJointMap.set(canonical, bones.get(entry.matchedBoneName)!);
      }
    }

    return {
      root: modelRoot,
      bones,
      canonicalJointMap,
      skinnedMeshes,
      morphTargetDictionary: morphDict,
      rawBoneNames,
      stats: {
        triangleCount: Math.round(totalTriangles),
        meshCount,
        boneCount: bones.size,
        isRigged: bones.size > 0
      }
    };
  }

  /**
   * Applies custom holographic rim material to all meshes while preserving skinning
   */
  public static applyHologramShader(
    model: LoadedRiggedModel,
    hologramShaderMaterial: THREE.ShaderMaterial
  ): void {
    model.root.traverse((node: THREE.Object3D) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const cloned = hologramShaderMaterial.clone();
        if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
          (cloned as any).skinning = true;
        }
        cloned.transparent = true;
        cloned.depthWrite = false;
        mesh.material = cloned;
      }
    });
  }
}
