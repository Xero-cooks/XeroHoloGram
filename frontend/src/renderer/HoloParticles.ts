import * as THREE from 'three';

/**
 * HoloParticles
 * Ambient cybernetic dust embers with soft glowing circular sprites,
 * coupled with an active holographic floor pedestal projector.
 */
export class HoloParticles {
  public group: THREE.Group;
  public points: THREE.Points;
  private particleCount: number;
  private positions: Float32Array;
  private initialPositions: Float32Array;
  private speeds: Float32Array;
  private opacities: Float32Array;

  // Flashy Holographic Floor Pedestal
  private pedestalGroup: THREE.Group;
  private outerRing: THREE.LineSegments;
  private innerRing: THREE.LineSegments;
  private radialLines: THREE.LineSegments;

  constructor(count: number = 220, bounds: { x: number; y: number; z: number } = { x: 2.6, y: 2.8, z: 2.2 }) {
    this.group = new THREE.Group();
    this.group.name = 'HoloAtmosphere';
    this.particleCount = count;
    this.positions = new Float32Array(count * 3);
    this.initialPositions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count * 3);
    this.opacities = new Float32Array(count);

    // 1. Soft Circular Glow Texture for Particles
    const particleTexture = this.createSoftCircleTexture();

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

      this.speeds[idx] = (Math.random() - 0.5) * 0.08;
      this.speeds[idx + 1] = 0.03 + Math.random() * 0.06;
      this.speeds[idx + 2] = (Math.random() - 0.5) * 0.08;
      this.opacities[i] = 0.2 + Math.random() * 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Lowered opacity and soft blending
    const material = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.032,
      map: particleTexture,
      transparent: true,
      opacity: 0.38, // Soft ambient glow, not blinding
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.group.add(this.points);

    // 2. Flashy Holographic Floor Pedestal / Projector Emitter
    this.pedestalGroup = new THREE.Group();
    this.pedestalGroup.position.set(0, 0.01, 0);

    // Outer Rotating Ring
    const outerRadius = 0.75;
    const outerRingGeo = new THREE.RingGeometry(outerRadius - 0.012, outerRadius, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const outerMesh = new THREE.Mesh(outerRingGeo, ringMat);
    outerMesh.rotation.x = Math.PI / 2;
    this.pedestalGroup.add(outerMesh);

    // Inner Concentric Ring with Dotted Edges
    const innerRadius = 0.48;
    const innerRingGeo = new THREE.RingGeometry(innerRadius - 0.008, innerRadius, 48);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.40,
      blending: THREE.AdditiveBlending
    });
    const innerMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerMesh.rotation.x = Math.PI / 2;
    this.pedestalGroup.add(innerMesh);

    // Center Core Emitter Disc
    const coreDiscGeo = new THREE.CircleGeometry(0.18, 32);
    const coreDiscMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const coreDisc = new THREE.Mesh(coreDiscGeo, coreDiscMat);
    coreDisc.rotation.x = Math.PI / 2;
    this.pedestalGroup.add(coreDisc);

    // 8-Way Radial Tick Marks
    const radialPts: THREE.Vector3[] = [];
    for (let a = 0; a < 8; a++) {
      const rad = (a * Math.PI) / 4;
      radialPts.push(
        new THREE.Vector3(Math.cos(rad) * 0.48, 0, Math.sin(rad) * 0.48),
        new THREE.Vector3(Math.cos(rad) * 0.75, 0, Math.sin(rad) * 0.75)
      );
    }
    const radialGeo = new THREE.BufferGeometry().setFromPoints(radialPts);
    const radialMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.radialLines = new THREE.LineSegments(radialGeo, radialMat);
    this.pedestalGroup.add(this.radialLines);

    this.outerRing = new THREE.LineSegments(new THREE.EdgesGeometry(outerRingGeo), radialMat);
    this.innerRing = new THREE.LineSegments(new THREE.EdgesGeometry(innerRingGeo), radialMat);

    this.group.add(this.pedestalGroup);
  }

  /**
   * Generates a circular Gaussian radial glow sprite
   */
  private createSoftCircleTexture(): THREE.CanvasTexture | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0, 240, 255, 1.0)');
    grad.addColorStop(0.35, 'rgba(0, 240, 255, 0.45)');
    grad.addColorStop(0.7, 'rgba(124, 58, 237, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  public update(delta: number, elapsed: number): void {
    const pos = this.points.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      pos[idx + 1] += this.speeds[idx + 1] * delta;
      pos[idx] += Math.sin(elapsed * 1.5 + i) * 0.0015;
      pos[idx + 2] += Math.cos(elapsed * 1.2 + i) * 0.0015;

      // Wrap around when rising past top threshold
      if (pos[idx + 1] > 2.8) {
        pos[idx + 1] = 0.05;
        pos[idx] = this.initialPositions[idx] + (Math.random() - 0.5) * 0.3;
        pos[idx + 2] = this.initialPositions[idx + 2] + (Math.random() - 0.5) * 0.3;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;

    // Flashy pedestal rotation
    if (this.pedestalGroup) {
      this.pedestalGroup.rotation.y = elapsed * 0.25;
      this.radialLines.rotation.y = -elapsed * 0.15;
    }
  }

  public setIntensity(opacity: number): void {
    (this.points.material as THREE.PointsMaterial).opacity = Math.max(0.05, Math.min(1.0, opacity));
  }
}
