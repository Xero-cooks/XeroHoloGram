/**
 * Pythagorean 45° Specular Reflection Solver
 * Householder reflection matrix algebra for Pepper's Ghost optical chambers.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export class PythagoreanReflection {
  private readonly angleRad: number;
  private readonly normal: Vector3D;
  private readonly reflectionMatrix: number[][];

  /**
   * @param glassAngleDeg Glass inclination angle relative to display floor (typically 45°)
   */
  constructor(glassAngleDeg: number = 45.0) {
    this.angleRad = (glassAngleDeg * Math.PI) / 180.0;
    
    // Normal vector to the mirror plane tilted at angle theta
    // Display is in XZ plane (y = 0), glass pivots along X axis
    const ny = Math.sin(this.angleRad);
    const nz = -Math.cos(this.angleRad);
    const len = Math.hypot(ny, nz);
    this.normal = { x: 0, y: ny / len, z: nz / len };

    // Householder reflection matrix: R = I - 2 * (n * n^T)
    const { x: nx, y, z } = this.normal;
    this.reflectionMatrix = [
      [1 - 2 * nx * nx, -2 * nx * y,     -2 * nx * z],
      [-2 * y * nx,     1 - 2 * y * y,   -2 * y * z],
      [-2 * z * nx,     -2 * z * y,       1 - 2 * z * z]
    ];
  }

  /**
   * Returns the 3x3 Householder reflection matrix
   */
  public getMatrix(): number[][] {
    return this.reflectionMatrix.map(row => [...row]);
  }

  /**
   * Computes the virtual reflected position P' of an emitted display point P
   * @param point Point on physical screen
   * @param glassOrigin Offset origin of the glass pivot in world space
   */
  public reflectPoint(point: Vector3D, glassOrigin: Vector3D = { x: 0, y: 0, z: 0 }): Vector3D {
    // Translate relative to glass origin
    const px = point.x - glassOrigin.x;
    const py = point.y - glassOrigin.y;
    const pz = point.z - glassOrigin.z;

    // Apply Householder transformation
    const rx = this.reflectionMatrix[0][0] * px + this.reflectionMatrix[0][1] * py + this.reflectionMatrix[0][2] * pz;
    const ry = this.reflectionMatrix[1][0] * px + this.reflectionMatrix[1][1] * py + this.reflectionMatrix[1][2] * pz;
    const rz = this.reflectionMatrix[2][0] * px + this.reflectionMatrix[2][1] * py + this.reflectionMatrix[2][2] * pz;

    return {
      x: rx + glassOrigin.x,
      y: ry + glassOrigin.y,
      z: rz + glassOrigin.z,
    };
  }

  /**
   * Computes apparent depth delta for an observer looking along horizontal Z axis
   */
  public computeApparentDepth(displayDistance: number): number {
    return displayDistance * Math.cos(this.angleRad);
  }
}
