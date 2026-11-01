import { describe, it, expect } from 'bun:test';
import { RigStudioDrawer } from '../src/ui/RigStudioDrawer';
import { Joint28 } from '../src/rig/CanonicalSkeleton';

describe('RigStudioDrawer Component', () => {
  it('should initialize and export valid rig_config.json structure', () => {
    let exportedConfig: any = null;
    const drawer = new RigStudioDrawer({
      onExportConfig: (cfg) => {
        exportedConfig = cfg;
      }
    });

    expect(drawer.getIsOpen()).toBe(false);
    drawer.toggle(true);
    expect(drawer.getIsOpen()).toBe(true);

    drawer.exportCurrentConfig();
    expect(exportedConfig).not.toBeNull();
    expect(exportedConfig.rig_name).toContain('XeroKratos');
    expect(exportedConfig.rest_pose_type).toBe('T_POSE');
    expect(exportedConfig.bone_mappings).toBeDefined();
  });

  it('should import and apply rig config', () => {
    const drawer = new RigStudioDrawer();
    const testConfig = {
      rig_name: 'test_model',
      rig_type: 'vrm' as const,
      bone_mappings: {
        [Joint28.head]: 'J_Bip_C_Head',
        [Joint28.neck]: 'J_Bip_C_Neck'
      },
      invert_x: false,
      invert_y: true,
      invert_z: false,
      rest_pose_type: 'A_POSE' as const,
      calib_quaternions: {}
    };

    drawer.importConfig(testConfig);
    const exported = drawer.exportCurrentConfig();
    expect(exported.invert_y).toBe(true);
    expect(exported.bone_mappings[Joint28.head]).toBe('J_Bip_C_Head');
  });
});
