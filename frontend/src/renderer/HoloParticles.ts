import * as THREE from 'three';

/**
 * HoloParticles
 * Procedural ambient holographic dust field floating around the 3D hologram stage.
 */
export class HoloParticles {
  public points: THREE.Points;
  private particleCount: number;
  private positions: Float32Array;
  private initialPositions: Float32Array;
  private speeds: Float32Array;

  constructor(count: number = 250, bounds: { x: number; y: number; z: number } = { x: 2.5, y: 3.0, z: 2.0 }) {
    this.particleCount = count;
    this.positions = new Float32Array(count * 3);
    this.initialPositions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count * 3);

    const geometry = new THREE.BufferGeometry();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = (Math.random() - 0.5) * bounds.x;
      const y = Math.random() * bounds.y;
      const z = (Math.random() - 0.5) * bounds.z;

      this.positions[idx] = x;
      this.positions[idx + 1] = y;
      this.positions[idx + 2] = z;

      this.initialPositions[idx] = x;
      this.initialPositions[idx + 1] = y;
      this.initialPositions[idx + 2] = z;

      this.speeds[idx] = (Math.random() - 0.5) * 0.15;
      this.speeds[idx + 1] = 0.05 + Math.random() * 0.1;
      this.speeds[idx + 2] = (Math.random() - 0.5) * 0.15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.022,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
  }

  public update(delta: number, elapsed: number): void {
    const pos = this.points.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      // Gentle floating drift with harmonic wave perturbation
      pos[idx + 1] += this.speeds[idx + 1] * delta;
      pos[idx] = this.initialPositions[idx] + Math.sin(elapsed * 0.5 + i) * 0.08;
      pos[idx + 2] = this.initialPositions[idx + 2] + Math.cos(elapsed * 0.4 + i) * 0.08;

      // Wrap-around ceiling
      if (pos[idx + 1] > 3.0) {
        pos[idx + 1] = 0.0;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
