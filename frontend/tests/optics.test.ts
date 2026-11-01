import { describe, expect, it } from 'bun:test';
import { PythagoreanReflection } from '../src/optics/pythagoreanReflection';
import { AxisInversionTransformer } from '../src/optics/axisInversion';
import { KeystoneHomographySolver } from '../src/optics/keystoneCorrection';
import { FOVPerspectiveSolver } from '../src/optics/fovSolver';

describe('Pythagorean Reflection Algebra', () => {
  it('should compute valid orthogonal involution reflection matrix for 45 degrees', () => {
    const solver = new PythagoreanReflection(45.0);
    const R = solver.getMatrix();

    // Involution test: R * R = Identity (within float tolerance)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += R[r][k] * R[k][c];
        }
        const expected = r === c ? 1 : 0;
        expect(Math.abs(sum - expected)).toBeLessThan(1e-5);
      }
    }
  });

  it('should correctly reflect a display point across 45 degree plane', () => {
    const solver = new PythagoreanReflection(45.0);
    // Point on display at origin height
    const point = { x: 0, y: -0.5, z: 0 };
    const reflected = solver.reflectPoint(point);

    // After reflection across y - z = 0, y maps to z and z maps to y
    expect(reflected.x).toBeCloseTo(0, 4);
    expect(reflected.y).toBeCloseTo(0, 4);
    expect(reflected.z).toBeCloseTo(-0.5, 4);
  });
});

describe('Axis Inversion Transforms', () => {
  it('should generate proper scale matrix and flip flags', () => {
    const transformer = new AxisInversionTransformer({ flipX: true, flipY: false });
    const scale = transformer.getProjectionScaleMatrix();

    expect(scale[0]).toBe(-1); // sx
    expect(scale[5]).toBe(1);  // sy
    expect(transformer.shouldInvertWindingOrder()).toBe(true);

    const [ndcX, ndcY] = transformer.transformNDC(0.5, -0.3);
    expect(ndcX).toBe(-0.5);
    expect(ndcY).toBe(-0.3);
  });
});

describe('Keystone Homography Solver', () => {
  it('should compute identity homography for standard unit square', () => {
    const H = KeystoneHomographySolver.computeHomography({
      topLeft: [0, 0],
      topRight: [1, 0],
      bottomRight: [1, 1],
      bottomLeft: [0, 1]
    });

    // Check diagonal is ~1 and off-diagonals are ~0
    expect(H[0]).toBeCloseTo(1, 3);
    expect(H[4]).toBeCloseTo(1, 3);
    expect(H[8]).toBeCloseTo(1, 3);
    expect(H[1]).toBeCloseTo(0, 3);
    expect(H[3]).toBeCloseTo(0, 3);

    const p = KeystoneHomographySolver.transformPoint(H, [0.5, 0.5]);
    expect(p[0]).toBeCloseTo(0.5, 3);
    expect(p[1]).toBeCloseTo(0.5, 3);
  });
});

describe('FOV Perspective Compensation', () => {
  it('should compensate vertical FOV for 45-degree angle', () => {
    const nominalFov = 40.0;
    const compensatedFov = FOVPerspectiveSolver.computeCompensatedFOV(nominalFov, 45.0);

    // Foreshortening requires wider vertical FOV to preserve 1:1 aspect ratio
    expect(compensatedFov).toBeGreaterThan(nominalFov);
    expect(compensatedFov).toBeLessThan(75.0);
  });

  it('should maintain nominal FOV when angle is zero', () => {
    const fov = FOVPerspectiveSolver.computeCompensatedFOV(45.0, 0.0);
    expect(fov).toBe(45.0);
  });
});
