/**
 * Optical Axis Inversion Solver
 * Manages chirality reversal (horizontal/vertical flip) for mirror reflections.
 */

export interface InversionState {
  flipX: boolean;
  flipY: boolean;
}

export class AxisInversionTransformer {
  private flipX: boolean;
  private flipY: boolean;

  constructor(initialState: InversionState = { flipX: true, flipY: false }) {
    this.flipX = initialState.flipX;
    this.flipY = initialState.flipY;
  }

  public setInversion(flipX: boolean, flipY: boolean): void {
    this.flipX = flipX;
    this.flipY = flipY;
  }

  public getInversion(): InversionState {
    return { flipX: this.flipX, flipY: this.flipY };
  }

  /**
   * Generates a 4x4 affine transform scale matrix for projection
   */
  public getProjectionScaleMatrix(): number[] {
    const sx = this.flipX ? -1.0 : 1.0;
    const sy = this.flipY ? -1.0 : 1.0;

    return [
      sx, 0,  0, 0,
      0,  sy, 0, 0,
      0,  0,  1, 0,
      0,  0,  0, 1,
    ];
  }

  /**
   * Transforms normalized device coordinates (NDC) [-1, 1]
   */
  public transformNDC(ndcX: number, ndcY: number): [number, number] {
    return [
      this.flipX ? -ndcX : ndcX,
      this.flipY ? -ndcY : ndcY,
    ];
  }

  /**
   * Determines if face winding order needs inversion to prevent backface culling issues
   */
  public shouldInvertWindingOrder(): boolean {
    // Parity of reflections: odd number of negative scales inverts winding
    return (this.flipX !== this.flipY);
  }
}
