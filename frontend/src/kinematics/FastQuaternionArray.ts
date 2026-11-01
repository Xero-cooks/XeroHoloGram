/**
 * Contiguous TypedArray Quaternion Buffer
 * Allocates 55 bones x 4 floats = 220 float64 elements in a flat contiguous buffer.
 */
export class FastQuaternionArray {
  public readonly count: number;
  public readonly data: Float64Array;

  constructor(boneCount: number = 55) {
    this.count = boneCount;
    this.data = new Float64Array(boneCount * 4);

    // Initialize all to identity quaternion (0, 0, 0, 1)
    for (let i = 0; i < boneCount; i++) {
      this.data[i * 4 + 3] = 1.0;
    }
  }

  public set(index: number, x: number, y: number, z: number, w: number): void {
    const offset = index * 4;
    this.data[offset] = x;
    this.data[offset + 1] = y;
    this.data[offset + 2] = z;
    this.data[offset + 3] = w;
  }

  public normalize(index: number): void {
    const offset = index * 4;
    const x = this.data[offset];
    const y = this.data[offset + 1];
    const z = this.data[offset + 2];
    const w = this.data[offset + 3];

    const len = Math.sqrt(x * x + y * y + z * z + w * w);
    if (len > 1e-7) {
      const invLen = 1.0 / len;
      this.data[offset] *= invLen;
      this.data[offset + 1] *= invLen;
      this.data[offset + 2] *= invLen;
      this.data[offset + 3] *= invLen;
    }
  }
}
