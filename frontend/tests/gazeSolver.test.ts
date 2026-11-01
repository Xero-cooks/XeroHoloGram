import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import { CanonicalBone } from '../src/rig/canonicalBones';
import { LookAtGazeSolver } from '../src/kinematics/LookAtGazeSolver';
import { JointLimitClamper } from '../src/kinematics/JointLimitClamper';

describe('Cervical Spine Look-At Gaze Solver', () => {
  it('should distribute gaze direction across cervical hierarchy', () => {
    const target = new THREE.Vector3(1.0, 1.45, 2.0); // 45 deg right
    const headPos = new THREE.Vector3(0, 1.45, 0);
    const avatarQuat = new THREE.Quaternion();

    const result = LookAtGazeSolver.solveLookAt(target, headPos, avatarQuat);

    // Head should receive ~35% of total rotation
    const headQ = result.rotations.get(CanonicalBone.Head);
    expect(headQ).toBeDefined();

    const headEuler = new THREE.Euler().setFromQuaternion(headQ!, 'YXZ');
    expect(headEuler.y).toBeGreaterThan(0.05);

    // Neck should receive ~25%
    const neckQ = result.rotations.get(CanonicalBone.Neck);
    expect(neckQ).toBeDefined();
    const neckEuler = new THREE.Euler().setFromQuaternion(neckQ!, 'YXZ');
    expect(neckEuler.y).toBeGreaterThan(0.03);
  });
});

describe('Joint Limit Clamper', () => {
  it('should clamp extreme head yaw angles within anatomical safety cone', () => {
    // Attempt extreme 90 degree head yaw
    const extremeYaw = (90.0 * Math.PI) / 180.0;
    const extremeQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, extremeYaw, 0, 'YXZ'));

    const clamped = JointLimitClamper.clampQuaternion(CanonicalBone.Head, extremeQ);
    const clampedEuler = new THREE.Euler().setFromQuaternion(clamped, 'YXZ');

    const maxAllowedYaw = JointLimitClamper.BONE_LIMITS[CanonicalBone.Head]!.maxYaw;
    expect(clampedEuler.y).toBeLessThanOrEqual(maxAllowedYaw + 1e-4);
  });
});
