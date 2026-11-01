/**
 * VRM Model Parser & Metadata Extractor
 * Extracts humanoid bone mappings and blendshape group configurations from VRM 0.x and 1.0 specs.
 */

export interface VRMHumanoidMetadata {
  version: '0.x' | '1.0';
  humanBones: Record<string, string>; // Canonical HumanBoneName -> Actual Bone Node Name
  blendShapeGroups: Record<string, string[]>; // Preset name -> morph target names
}

export class VRMModelParser {
  /**
   * Parses extensions block from glTF JSON chunk
   */
  public static extractVRMMetadata(gltfExtensions: Record<string, any>): VRMHumanoidMetadata | null {
    // 1. Check for VRM 1.0 (VRMC_vrm)
    if (gltfExtensions?.VRMC_vrm) {
      const vrm1 = gltfExtensions.VRMC_vrm;
      const humanBones: Record<string, string> = {};
      const bonesSpec = vrm1.humanoid?.humanBones || {};

      for (const [key, value] of Object.entries(bonesSpec)) {
        if (value && typeof value === 'object' && 'node' in value) {
          humanBones[key] = String((value as any).node);
        }
      }

      const blendShapeGroups: Record<string, string[]> = {};
      const expressions = vrm1.expressions?.preset || {};
      for (const [exprName, exprObj] of Object.entries(expressions)) {
        blendShapeGroups[exprName] = [exprName];
      }

      return {
        version: '1.0',
        humanBones,
        blendShapeGroups,
      };
    }

    // 2. Check for VRM 0.x (VRM)
    if (gltfExtensions?.VRM) {
      const vrm0 = gltfExtensions.VRM;
      const humanBones: Record<string, string> = {};
      const bonesList = vrm0.humanoid?.humanBones || [];

      for (const item of bonesList) {
        if (item.bone && item.node !== undefined) {
          humanBones[item.bone] = String(item.node);
        }
      }

      const blendShapeGroups: Record<string, string[]> = {};
      const groups = vrm0.blendShapeMaster?.blendShapeGroups || [];
      for (const group of groups) {
        if (group.presetName || group.name) {
          const name = group.presetName || group.name;
          blendShapeGroups[name] = [name];
        }
      }

      return {
        version: '0.x',
        humanBones,
        blendShapeGroups,
      };
    }

    return null;
  }
}
