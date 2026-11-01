import * as THREE from 'three';

/**
 * FloatingWidgets handles cybernetic holographic augmentations:
 * 1. Left-wrist anchored floating hologram terminal with live stdout/logs canvas texture.
 * 2. Floating sub-agent wireframe clone or geometric orb spawner beside the main character.
 */
export interface SubAgentOrb {
  id: string;
  name: string;
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  particles: THREE.Points;
  birthTime: number;
  dissolving: boolean;
  dissolveProgress: number;
}

export class FloatingWidgets {
  public group: THREE.Group;
  
  // Wrist Terminal Components
  private wristTerminalGroup: THREE.Group;
  private terminalCanvas: HTMLCanvasElement;
  private terminalCtx: CanvasRenderingContext2D | null;
  private terminalTexture: THREE.CanvasTexture;
  private terminalMesh: THREE.Mesh;
  private terminalVisible: boolean = false;
  private logLines: string[] = [
    '[SYS_INIT] AGENTIC-HOLOGRAM DUAL-STREAM READY',
    '[WS_STATUS] PROTOCOL CONNECTED: ws://localhost:8765/ws/hologram',
    '[KINEMATICS] 60Hz SO(3) SPRING SOLVER ACTIVE',
    '[OPTICS] 45-DEG PYTHAGOREAN STAGE ALIGNED'
  ];

  // Sub-Agent Spawner Components
  private activeSubAgents: Map<string, SubAgentOrb> = new Map();
  private subAgentParentGroup: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FloatingWidgets';

    this.subAgentParentGroup = new THREE.Group();
    this.subAgentParentGroup.name = 'SubAgentOrbs';
    this.group.add(this.subAgentParentGroup);

    // 1. Initialize Wrist Terminal
    this.wristTerminalGroup = new THREE.Group();
    this.wristTerminalGroup.name = 'WristTerminal';
    this.wristTerminalGroup.visible = false;

    // Create 512x256 Offscreen Canvas (environment safe)
    if (typeof document !== 'undefined') {
      this.terminalCanvas = document.createElement('canvas');
      this.terminalCanvas.width = 512;
      this.terminalCanvas.height = 256;
      this.terminalCtx = this.terminalCanvas.getContext('2d');
      this.renderTerminalCanvas();
      this.terminalTexture = new THREE.CanvasTexture(this.terminalCanvas);
      this.terminalTexture.minFilter = THREE.LinearFilter;
      this.terminalTexture.magFilter = THREE.LinearFilter;
    } else {
      // Headless/test fallback
      this.terminalCanvas = null as any;
      this.terminalCtx = null;
      this.terminalTexture = new THREE.Texture() as THREE.CanvasTexture;
    }

    // Holographic quad plane
    const planeGeo = new THREE.PlaneGeometry(0.35, 0.18);
    const planeMat = new THREE.MeshBasicMaterial({
      map: this.terminalTexture,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.terminalMesh = new THREE.Mesh(planeGeo, planeMat);
    this.wristTerminalGroup.add(this.terminalMesh);

    // Glowing border frame
    const edges = new THREE.EdgesGeometry(planeGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    this.wristTerminalGroup.add(wireframe);

    this.group.add(this.wristTerminalGroup);
  }

  /**
   * Re-draws terminal canvas with cybernetic sci-fi styling
   */
  private renderTerminalCanvas(): void {
    if (!this.terminalCtx) return;
    const ctx = this.terminalCtx;
    const w = this.terminalCanvas.width;
    const h = this.terminalCanvas.height;

    // Dark semi-transparent cybernetic background
    ctx.fillStyle = 'rgba(2, 12, 28, 0.75)';
    ctx.fillRect(0, 0, w, h);

    // Header bar
    ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.fillRect(0, 0, w, 28);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.fillText('◈ XERO-HOLOGRAM CORE SHELL v2.4 // STDOUT', 12, 19);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 243, 255, 0.04)';
    for (let y = 30; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1);
    }

    // Body logs
    ctx.font = '11px monospace';
    ctx.fillStyle = '#5eead4';
    const startY = 50;
    const lineHeight = 18;
    const maxLines = 10;
    const recent = this.logLines.slice(-maxLines);

    recent.forEach((line, idx) => {
      if (line.includes('[ERR') || line.includes('FAIL')) {
        ctx.fillStyle = '#ff0055';
      } else if (line.includes('[WARN')) {
        ctx.fillStyle = '#f59e0b';
      } else if (line.includes('[D3')) {
        ctx.fillStyle = '#38bdf8';
      } else if (line.includes('[SYS')) {
        ctx.fillStyle = '#10b981';
      } else {
        ctx.fillStyle = '#00f3ff';
      }
      ctx.fillText(`> ${line}`, 14, startY + idx * lineHeight);
    });

    // Blinking cursor
    const cursorY = startY + recent.length * lineHeight - 5;
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(14, cursorY, 8, 12);
    }
  }

  /**
   * Push a stdout log line to the wrist terminal
   */
  public log(line: string): void {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    this.logLines.push(`[${timestamp}] ${line}`);
    if (this.logLines.length > 50) {
      this.logLines.shift();
    }
    this.renderTerminalCanvas();
    this.terminalTexture.needsUpdate = true;
  }

  /**
   * Set wrist terminal visibility
   */
  public setTerminalVisible(visible: boolean): void {
    this.terminalVisible = visible;
    this.wristTerminalGroup.visible = visible;
  }

  public isTerminalVisible(): boolean {
    return this.terminalVisible;
  }

  /**
   * Update wrist terminal position based on character's left wrist bone
   */
  public updateWristAttachment(wristBone: THREE.Bone | THREE.Object3D | null): void {
    if (!wristBone || !this.terminalVisible) return;

    // Get world position and rotation of the wrist bone
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    wristBone.getWorldPosition(worldPos);
    wristBone.getWorldQuaternion(worldQuat);

    // Offset 10cm outward along the local wrist normal
    const offset = new THREE.Vector3(0.08, 0.12, 0.05).applyQuaternion(worldQuat);
    this.wristTerminalGroup.position.copy(worldPos).add(offset);
    this.wristTerminalGroup.quaternion.copy(worldQuat);
  }

  /**
   * Spawn a floating 3D sub-agent wireframe clone orb beside the avatar
   */
  public spawnSubAgent(id: string, name: string = 'SubAgent-Worker'): void {
    if (this.activeSubAgents.has(id)) return;

    const orbGroup = new THREE.Group();
    // Offset beside the main character (e.g. to the right and slightly up)
    const slotIdx = this.activeSubAgents.size;
    const xOffset = slotIdx % 2 === 0 ? 0.65 + (slotIdx * 0.15) : -0.65 - (slotIdx * 0.15);
    const yOffset = 1.35 + Math.sin(slotIdx) * 0.2;
    orbGroup.position.set(xOffset, yOffset, 0.2);

    // Core Wireframe Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(0.12, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    orbGroup.add(coreMesh);

    // Orbital Ring
    const ringGeo = new THREE.TorusGeometry(0.18, 0.005, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    orbGroup.add(ringMesh);

    // Surrounding Particle Swarm
    const particleCount = 48;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = 0.22 + Math.random() * 0.08;
      positions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = rad * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.02,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    orbGroup.add(particles);

    this.subAgentParentGroup.add(orbGroup);

    this.activeSubAgents.set(id, {
      id,
      name,
      group: orbGroup,
      coreMesh,
      ringMesh,
      particles,
      birthTime: performance.now(),
      dissolving: false,
      dissolveProgress: 0
    });

    this.log(`SPAWNED SUBAGENT: ${name} [${id}]`);
  }

  /**
   * Dismiss sub-agent with dissolution animation
   */
  public dismissSubAgent(id: string): void {
    const orb = this.activeSubAgents.get(id);
    if (!orb) return;
    orb.dissolving = true;
    this.log(`DISMISSING SUBAGENT: ${orb.name} [${id}]`);
  }

  /**
   * Per-frame animation tick (60Hz)
   */
  public update(timeMs: number): void {
    // 1. Update terminal canvas every 400ms for cursor blink
    if (this.terminalVisible && Math.floor(timeMs / 400) % 2 === 0) {
      this.renderTerminalCanvas();
      this.terminalTexture.needsUpdate = true;
    }

    // 2. Animate all active sub-agent orbs
    const toRemove: string[] = [];

    this.activeSubAgents.forEach((orb, id) => {
      const age = (timeMs - orb.birthTime) * 0.001;

      if (orb.dissolving) {
        orb.dissolveProgress += 0.04;
        const scale = Math.max(0.001, 1 - orb.dissolveProgress);
        orb.group.scale.set(scale, scale, scale);
        (orb.coreMesh.material as THREE.MeshBasicMaterial).opacity = 1 - orb.dissolveProgress;
        (orb.ringMesh.material as THREE.MeshBasicMaterial).opacity = 1 - orb.dissolveProgress;

        if (orb.dissolveProgress >= 1) {
          toRemove.push(id);
        }
      } else {
        // Subtle floating bobbing
        orb.group.position.y += Math.sin(age * 3) * 0.0008;

        // Core rotation
        orb.coreMesh.rotation.x = age * 0.8;
        orb.coreMesh.rotation.y = age * 1.2;

        // Ring orbital spin
        orb.ringMesh.rotation.z = age * 1.5;
        orb.ringMesh.rotation.y = Math.sin(age * 0.5) * 0.4;

        // Particles rotation
        orb.particles.rotation.y = -age * 0.6;
      }
    });

    // Clean up dissolved orbs
    for (const id of toRemove) {
      const orb = this.activeSubAgents.get(id);
      if (orb) {
        this.subAgentParentGroup.remove(orb.group);
        this.activeSubAgents.delete(id);
      }
    }
  }

  public getActiveSubAgentCount(): number {
    return this.activeSubAgents.size;
  }
}
