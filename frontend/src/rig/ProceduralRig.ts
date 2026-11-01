import * as THREE from 'three';
import { Joint28 } from './CanonicalSkeleton';

export interface XeroKratosRig {
  root: THREE.Group;
  bones: Map<Joint28, THREE.Bone>;
  skinnedMesh: THREE.SkinnedMesh | THREE.Group;
  reactorCore: THREE.Mesh;
  visorMesh: THREE.Mesh;
  jawBone: THREE.Bone;
  updateReactorPulse: (voiceRms: number, delta: number) => void;
  setShaderColor?: (hexColor: number) => void;
}

/**
 * ProceduralRig
 * Builds the complete articulated XeroKratos Cybernetic Humanoid Rig.
 * Equipped with 28 canonical bones, glowing Fresnel rim shader,
 * articulated jaw, visor, glowing reactor core, and robotic limbs.
 */
export class ProceduralRig {
  /**
   * Holographic Fresnel Rim Shader Material with scanlines and glow
   */
  public static createHoloMaterial(hexColor: number = 0x00f0ff, opacity: number = 0.90): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(hexColor) },
        uTime: { value: 0 },
        uOpacity: { value: opacity }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPos;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.0);
          float scanline = 0.88 + 0.12 * sin(vWorldPos.y * 60.0 - uTime * 6.0);
          vec3 col = uColor * (0.45 + 1.6 * fresnel) * scanline;
          gl_FragColor = vec4(col, clamp((0.35 + fresnel * 0.9) * uOpacity, 0.0, 1.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  public static createXeroKratos(): XeroKratosRig {
    const root = new THREE.Group();
    root.name = 'XeroKratos-Default';

    const bones = new Map<Joint28, THREE.Bone>();
    const holoMat = this.createHoloMaterial(0x00f0ff, 0.92);
    const coreMat = this.createHoloMaterial(0xffffff, 0.95);
    const accentMat = this.createHoloMaterial(0x7c3aed, 0.85);

    // Helper for procedural tapered limb geometry
    const limbGeo = (rTop: number, rBot: number, len: number) => {
      const g = new THREE.CylinderGeometry(rTop, rBot, len, 12, 4, true);
      g.translate(0, len / 2, 0);
      return g;
    };

    // 1. Pelvis Root Bone
    const pelvis = new THREE.Bone();
    pelvis.name = Joint28.pelvis;
    pelvis.position.set(0, 0.92, 0);
    root.add(pelvis);
    bones.set(Joint28.pelvis, pelvis);

    // Pelvis Armor Mesh
    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.12, 10, 2, true), holoMat);
    pelvisMesh.position.y = 0.02;
    pelvis.add(pelvisMesh);

    // 2. Spine Chain
    const spine01 = new THREE.Bone();
    spine01.name = Joint28.spine_01;
    spine01.position.set(0, 0.14, 0);
    pelvis.add(spine01);
    bones.set(Joint28.spine_01, spine01);

    const spine02 = new THREE.Bone();
    spine02.name = Joint28.spine_02;
    spine02.position.set(0, 0.16, 0);
    spine01.add(spine02);
    bones.set(Joint28.spine_02, spine02);

    // Cybernetic Torso Armor Plates
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.38, 12, 4, true), holoMat);
    torsoMesh.position.y = 0.08;
    spine02.add(torsoMesh);

    // Rotating Octahedron Reactor Core (Voice-reactive)
    const reactorGeo = new THREE.OctahedronGeometry(0.065, 0);
    const reactorCore = new THREE.Mesh(reactorGeo, coreMat);
    reactorCore.position.set(0, 0.10, 0.12);
    spine02.add(reactorCore);

    // Reactor Core Outer Ring
    const ringGeo = new THREE.TorusGeometry(0.09, 0.006, 8, 32);
    const reactorRing = new THREE.Mesh(ringGeo, accentMat);
    reactorRing.position.set(0, 0.10, 0.11);
    spine02.add(reactorRing);

    // 3. Neck & Head
    const neck = new THREE.Bone();
    neck.name = Joint28.neck;
    neck.position.set(0, 0.22, 0);
    spine02.add(neck);
    bones.set(Joint28.neck, neck);

    const neckMesh = new THREE.Mesh(limbGeo(0.06, 0.07, 0.10), holoMat);
    neck.add(neckMesh);

    const head = new THREE.Bone();
    head.name = Joint28.head;
    head.position.set(0, 0.12, 0);
    neck.add(head);
    bones.set(Joint28.head, head);

    // Faceted Sci-Fi Head
    const headGeo = new THREE.OctahedronGeometry(0.14, 2);
    const headMesh = new THREE.Mesh(headGeo, holoMat);
    headMesh.scale.set(0.85, 1.15, 0.95);
    headMesh.position.y = 0.12;
    head.add(headMesh);

    // Glowing Cyan Visor
    const visorGeo = new THREE.BoxGeometry(0.17, 0.035, 0.09);
    const visorMesh = new THREE.Mesh(visorGeo, coreMat);
    visorMesh.position.set(0, 0.14, 0.11);
    head.add(visorMesh);

    // Articulated Jaw Bone for Lip-Sync
    const jaw = new THREE.Bone();
    jaw.name = Joint28.jaw;
    jaw.position.set(0, 0.06, 0.06);
    head.add(jaw);
    bones.set(Joint28.jaw, jaw);

    const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.024, 0.08), coreMat);
    jawMesh.position.set(0, -0.01, 0.04);
    jaw.add(jawMesh);

    // 4. Arms & Hands Setup
    const setupArm = (side: 'L' | 'R') => {
      const s = side === 'L' ? 1 : -1;
      const clavicleKey = side === 'L' ? Joint28.clavicle_L : Joint28.clavicle_R;
      const upperArmKey = side === 'L' ? Joint28.upper_arm_L : Joint28.upper_arm_R;
      const lowerArmKey = side === 'L' ? Joint28.lower_arm_L : Joint28.lower_arm_R;
      const handKey = side === 'L' ? Joint28.hand_L : Joint28.hand_R;
      const thumbKey = side === 'L' ? Joint28.thumb_L : Joint28.thumb_R;
      const indexKey = side === 'L' ? Joint28.index_L : Joint28.index_R;
      const middleKey = side === 'L' ? Joint28.middle_L : Joint28.middle_R;
      const ringKey = side === 'L' ? Joint28.ring_L : Joint28.ring_R;
      const pinkyKey = side === 'L' ? Joint28.pinky_L : Joint28.pinky_R;

      // Clavicle
      const clavicle = new THREE.Bone();
      clavicle.name = clavicleKey;
      clavicle.position.set(s * 0.08, 0.18, 0);
      spine02.add(clavicle);
      bones.set(clavicleKey, clavicle);

      // Upper Arm
      const upperArm = new THREE.Bone();
      upperArm.name = upperArmKey;
      upperArm.position.set(s * 0.16, -0.02, 0);
      clavicle.add(upperArm);
      bones.set(upperArmKey, upperArm);

      const upperArmMesh = new THREE.Mesh(limbGeo(0.048, 0.038, 0.28), holoMat);
      upperArmMesh.position.y = -0.28;
      upperArm.add(upperArmMesh);

      // Lower Arm
      const lowerArm = new THREE.Bone();
      lowerArm.name = lowerArmKey;
      lowerArm.position.set(0, -0.28, 0);
      upperArm.add(lowerArm);
      bones.set(lowerArmKey, lowerArm);

      const lowerArmMesh = new THREE.Mesh(limbGeo(0.038, 0.028, 0.26), holoMat);
      lowerArmMesh.position.y = -0.26;
      lowerArm.add(lowerArmMesh);

      // Hand
      const hand = new THREE.Bone();
      hand.name = handKey;
      hand.position.set(0, -0.26, 0);
      lowerArm.add(hand);
      bones.set(handKey, hand);

      const handMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), holoMat);
      handMesh.position.y = -0.035;
      hand.add(handMesh);

      // Fingers
      const thumb = new THREE.Bone();
      thumb.name = thumbKey;
      thumb.position.set(s * 0.025, -0.02, 0.015);
      hand.add(thumb);
      bones.set(thumbKey, thumb);

      const index = new THREE.Bone();
      index.name = indexKey;
      index.position.set(s * 0.018, -0.07, 0);
      hand.add(index);
      bones.set(indexKey, index);
      const indexMesh = new THREE.Mesh(limbGeo(0.008, 0.006, 0.05), coreMat);
      indexMesh.position.y = -0.05;
      index.add(indexMesh);

      const middle = new THREE.Bone();
      middle.name = middleKey;
      middle.position.set(s * 0.006, -0.07, 0);
      hand.add(middle);
      bones.set(middleKey, middle);
      const midMesh = new THREE.Mesh(limbGeo(0.008, 0.006, 0.055), holoMat);
      midMesh.position.y = -0.055;
      middle.add(midMesh);

      const ring = new THREE.Bone();
      ring.name = ringKey;
      ring.position.set(s * -0.006, -0.068, 0);
      hand.add(ring);
      bones.set(ringKey, ring);

      const pinky = new THREE.Bone();
      pinky.name = pinkyKey;
      pinky.position.set(s * -0.018, -0.062, 0);
      hand.add(pinky);
      bones.set(pinkyKey, pinky);
    };

    setupArm('L');
    setupArm('R');

    // 5. Legs Setup
    const setupLeg = (side: 'L' | 'R') => {
      const s = side === 'L' ? 1 : -1;
      const upperLegKey = side === 'L' ? Joint28.upper_leg_L : Joint28.upper_leg_R;
      const lowerLegKey = side === 'L' ? Joint28.lower_leg_L : Joint28.lower_leg_R;

      const upperLeg = new THREE.Bone();
      upperLeg.name = upperLegKey;
      upperLeg.position.set(s * 0.11, -0.06, 0);
      pelvis.add(upperLeg);
      bones.set(upperLegKey, upperLeg);

      const upperLegMesh = new THREE.Mesh(limbGeo(0.065, 0.045, 0.44), holoMat);
      upperLegMesh.position.y = -0.44;
      upperLeg.add(upperLegMesh);

      const lowerLeg = new THREE.Bone();
      lowerLeg.name = lowerLegKey;
      lowerLeg.position.set(0, -0.44, 0);
      upperLeg.add(lowerLeg);
      bones.set(lowerLegKey, lowerLeg);

      const lowerLegMesh = new THREE.Mesh(limbGeo(0.045, 0.035, 0.42), holoMat);
      lowerLegMesh.position.y = -0.42;
      lowerLeg.add(lowerLegMesh);
    };

    setupLeg('L');
    setupLeg('R');

    // Dynamic Voice Pulse update handler
    const updateReactorPulse = (voiceRms: number, delta: number) => {
      const t = performance.now() * 0.001;
      holoMat.uniforms.uTime.value = t;
      coreMat.uniforms.uTime.value = t;
      accentMat.uniforms.uTime.value = t;

      // Rotate core & ring
      reactorCore.rotation.y += (1.8 + voiceRms * 9.0) * delta;
      reactorCore.rotation.x += (1.0 + voiceRms * 5.0) * delta;
      reactorRing.rotation.z -= (1.2 + voiceRms * 6.0) * delta;

      // Pulse reactor core size with voice amplitude
      const scale = 1.0 + Math.min(voiceRms * 1.6, 0.8);
      reactorCore.scale.set(scale, scale, scale);

      // Modulate Visor glow brightness
      const visorMat = visorMesh.material as THREE.ShaderMaterial;
      if (visorMat.uniforms?.uOpacity) {
        visorMat.uniforms.uOpacity.value = 0.85 + Math.min(voiceRms * 0.4, 0.15);
      }
    };

    const setShaderColor = (hexColor: number) => {
      holoMat.uniforms.uColor.value.setHex(hexColor);
    };

    return {
      root,
      bones,
      skinnedMesh: root,
      reactorCore,
      visorMesh,
      jawBone: jaw,
      updateReactorPulse,
      setShaderColor
    };
  }
}
