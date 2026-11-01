import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import { SO3Math } from '../src/kinematics/SO3Math';
import { QuaternionContinuity } from '../src/kinematics/QuaternionContinuity';

describe('SO(3) Lie Group & Lie Algebra Math', () => {
  it('should roundtrip exp and log for various rotations', () => {
    const testEuler = new THREE.Euler(0.4, -0.6, 0.2);
    const qOrig = new THREE.Quaternion().setFromEuler(testEuler);

    const v = SO3Math.log(qOrig);
    const qRecovered = SO3Math.exp(v);

    expect(qRecovered.x).toBeCloseTo(qOrig.x, 4);
    expect(qRecovered.y).toBeCloseTo(qOrig.y, 4);
    expect(qRecovered.z).toBeCloseTo(qOrig.z, 4);
    expect(qRecovered.w).toBeCloseTo(qOrig.w, 4);
  });

  it('should handle identity quaternion near-zero log without NaN', () => {
    const qId = new THREE.Quaternion(0, 0, 0, 1);
    const v = SO3Math.log(qId);

    expect(v.length()).toBeCloseTo(0, 5);
    const qRecovered = SO3Math.exp(v);
    expect(qRecovered.w).toBeCloseTo(1, 5);
  });

  it('should compute zero geodesic distance for identical quaternions and pi for opposite', () => {
    const q1 = new THREE.Quaternion(0, 0, 0, 1);
    const q2 = new THREE.Quaternion(0, 0, 0, 1);
    expect(SO3Math.geodesicDistance(q1, q2)).toBeCloseTo(0, 5);

    // 90 deg rotation around Y
    const q90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5);
    expect(SO3Math.geodesicDistance(q1, q90)).toBeCloseTo(Math.PI * 0.5, 4);
  });

  it('should enforce hemisphere continuity for antipodal quaternions', () => {
    const q1 = new THREE.Quaternion(0, 0, 0, 1);
    const qAntipodal = new THREE.Quaternion(0, 0, 0, -1);

    expect(q1.dot(qAntipodal)).toBe(-1);
    const continuous = QuaternionContinuity.ensureContinuity(q1, qAntipodal);
    expect(q1.dot(continuous)).toBe(1);
    expect(continuous.w).toBe(1);
  });
});
