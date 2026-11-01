/**
 * Trapezoidal Keystone Projective Homography Solver
 * Uses Direct Linear Transformation (DLT) to calculate the 3x3 homography matrix H
 * mapping normalized unit square [0,1]^2 to arbitrary quadrilateral corners.
 */

export type Point2D = [number, number];

export interface QuadrilateralCorners {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
}

export class KeystoneHomographySolver {
  /**
   * Computes 3x3 homography matrix transforming unit square [0,1]^2 to quadrilateral corners
   */
  public static computeHomography(quad: QuadrilateralCorners): number[] {
    const src: Point2D[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ];
    const dst: Point2D[] = [
      quad.topLeft,
      quad.topRight,
      quad.bottomRight,
      quad.bottomLeft
    ];

    // Build 8x8 linear system A * h = b
    const A: number[][] = [];
    const b: number[] = [];

    for (let i = 0; i < 4; i++) {
      const [sx, sy] = src[i];
      const [dx, dy] = dst[i];

      A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
      b.push(dx);

      A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
      b.push(dy);
    }

    // Solve using Gaussian elimination
    const h = KeystoneHomographySolver.solveLinearSystem(A, b);
    return [
      h[0], h[1], h[2],
      h[3], h[4], h[5],
      h[6], h[7], 1.0
    ];
  }

  /**
   * Transforms a 2D point (u, v) using homography matrix H
   */
  public static transformPoint(H: number[], point: Point2D): Point2D {
    const [u, v] = point;
    const x = H[0] * u + H[1] * v + H[2];
    const y = H[3] * u + H[4] * v + H[5];
    const w = H[6] * u + H[7] * v + H[8];
    if (Math.abs(w) < 1e-7) return [x, y];
    return [x / w, y / w];
  }

  private static solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = 8;
    const M: number[][] = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
      // Pivot selection
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
          maxRow = k;
        }
      }
      [M[i], M[maxRow]] = [M[maxRow], M[i]];

      const pivot = M[i][i];
      if (Math.abs(pivot) < 1e-9) continue;

      for (let j = i; j <= n; j++) {
        M[i][j] /= pivot;
      }

      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = M[k][i];
          for (let j = i; j <= n; j++) {
            M[k][j] -= factor * M[i][j];
          }
        }
      }
    }

    return M.map(row => row[n]);
  }
}
