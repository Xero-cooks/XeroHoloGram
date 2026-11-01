import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import { SO3SpringDamper } from '../src/kinematics/SO3SpringDamper';
import { SO3Math } from '../src/kinematics/SO3Math';

describe('60Hz SO(3) Spring-Damper Solver Convergence', () => {
  it('should smoothly converge to target rotation without overshoot', () => {
    const solver = new SO3SpringDamper(
      new THREE.Quaternion(),
      { naturalFrequency: 24.0, dampingRatio: 1.0 }
    );

    const target = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -0.4, 0.1));
    solver.setTarget(target);

    const dt = 1.0 / 60.0;
    let prevDistance = SO3Math.geodesicDistance(solver.currentRotation, target);

    // Simulate 60 frames (1 second)
    for (let i = 0; i < 60; i++) {
      solver.step(dt);
      const currentDistance = SO3Math.geodesicDistance(solver.currentRotation, target);

      // Distance should decrease monotonically towards 0
      expect(currentDistance).toBeLessThanOrEqual(prevDistance + 1e-4);
      prevDistance = currentDistance;
    }

    // After 1 second of critical damping at omega = 24, final error should be negligible
    const finalDistance = SO3Math.geodesicDistance(solver.currentRotation, target);
    expect(finalDistance).toBeLessThan(0.005);
    expect(solver.angularVelocity.length()).toBeLessThan(0.05);
  });

  it('should reset position and zero angular velocity', () => {
    const solver = new SO3SpringDamper();
    solver.angularVelocity.set(2, 3, 4);
    solver.reset(new THREE.Quaternion());

    expect(solver.angularVelocity.length()).toBe(0);
    expect(solver.currentRotation.w).toBe(1);
  });
});
