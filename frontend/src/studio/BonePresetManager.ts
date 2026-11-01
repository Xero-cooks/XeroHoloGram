import { CanonicalBone, BoneMappingEntry, BoneMappingTable } from '../rig/canonicalBones';

export interface BoneMappingPresetJSON {
  version: '1.0';
  modelIdentifier?: string;
  timestamp: number;
  mappings: Array<{
    canonical: string;
    sourceBoneName: string;
    confidence: number;
    isManualOverride: boolean;
  }>;
}

export class BonePresetManager {
  /**
   * Serializes a BoneMappingTable into a portable JSON string
   */
  public static exportToJSON(table: BoneMappingTable, modelIdentifier?: string): string {
    const list: BoneMappingPresetJSON['mappings'] = [];

    for (const [canonical, entry] of table.entries()) {
      list.push({
        canonical,
        sourceBoneName: entry.sourceBoneName,
        confidence: entry.confidence,
        isManualOverride: entry.isManualOverride,
      });
    }

    const preset: BoneMappingPresetJSON = {
      version: '1.0',
      modelIdentifier,
      timestamp: Date.now(),
      mappings: list,
    };

    return JSON.stringify(preset, null, 2);
  }

  /**
   * Parses and validates a JSON string back into a BoneMappingTable
   */
  public static importFromJSON(jsonString: string): BoneMappingTable {
    const data = JSON.parse(jsonString) as BoneMappingPresetJSON;
    const table: BoneMappingTable = new Map();

    if (!data.mappings || !Array.isArray(data.mappings)) {
      throw new Error('Invalid BoneMappingPreset JSON: missing mappings array');
    }

    for (const item of data.mappings) {
      if (item.canonical in CanonicalBone) {
        table.set(item.canonical as CanonicalBone, {
          canonical: item.canonical as CanonicalBone,
          sourceBoneName: item.sourceBoneName,
          confidence: item.confidence ?? 1.0,
          isManualOverride: !!item.isManualOverride,
        });
      }
    }

    return table;
  }
}
