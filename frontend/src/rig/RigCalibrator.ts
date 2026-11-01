import * as THREE from 'three';
import { Joint28 } from './CanonicalSkeleton';

export interface CalibrationSetting {
  calibQuaternion: THREE.Quaternion;
  invertX: boolean;
  invertY: boolean;
  invertZ: boolean;
}

export class RigCalibrator {
  private calibrationMap: Map<Joint28, CalibrationSetting> = new Map();

  constructor() {
    // Default calibration is identity with no axis inversions
    for (const joint of Object.values(Joint28)) {
      this.calibrationMap.set(joint as Joint28, {
        calibQuaternion: new THREE.Quaternion(),
        invertX: false,
        invertY: false,
        invertZ: false,
      });
    }
  }

  public setAxisInversion(joint: Joint28, invertX: boolean, invertY: boolean, invertZ: boolean): void {
    const setting = this.calibrationMap.get(joint);
    if (setting) {
      setting.invertX = invertX;
      setting.invertY = invertY;
      setting.invertZ = invertZ;
    }
  }

  public setCalibOffset(joint: Joint28, offsetQuaternion: THREE.Quaternion): void {
    const setting = this.calibrationMap.get(joint);
    if (setting) {
      setting.calibQuaternion.copy(offsetQuaternion);
    }
  }

  /**
   * Computes final world quaternion:
   * q_world(t) = q_bind * q_calib * q_dynamic(t)
   */
  public computeJointRotation(
    joint: Joint28,
    qBind: THREE.Quaternion,
    qDynamic: THREE.Quaternion
  ): THREE.Quaternion {
    const setting = this.calibrationMap.get(joint) || {
      calibQuaternion: new THREE.Quaternion(),
      invertX: false,
      invertY: false,
      invertZ: false,
    };

    const dynamicEuler = new THREE.Euler().setFromQuaternion(qDynamic, 'YXZ');
    if (setting.invertX) dynamicEuler.x = -dynamicEuler.x;
    if (setting.invertY) dynamicEuler.y = -dynamicEuler.y;
    if (setting.invertZ) dynamicEuler.z = -dynamicEuler.z;

    const adjustedDynamic = new THREE.Quaternion().setFromEuler(dynamicEuler);

    // q_world = q_bind * q_calib * adjustedDynamic
    return qBind.clone().multiply(setting.calibQuaternion).multiply(adjustedDynamic);
  }
}
