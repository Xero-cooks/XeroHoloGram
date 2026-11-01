import * as THREE from 'three';
import { CanonicalBone, BoneMappingTable } from '../rig/canonicalBones';

export interface VisualBoneMarker {
  boneName: string;
  canonical?: CanonicalBone;
  mesh: THREE.Mesh;
  worldPosition: THREE.Vector3;
  confidence: number;
}

export class VisualBoneStudio {
  public group: THREE.Group;
  private markers: Map<string, VisualBoneMarker> = new Map();
  private raycaster: THREE.Raycaster;
  private selectedMarker: VisualBoneMarker | null = null;
  private skeletonLines: THREE.LineSegments | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.raycaster = new THREE.Raycaster();
  }

  /**
   * Builds 3D visual marker spheres at bone positions
   */
  public buildMarkers(
    bones: Map<string, THREE.Bone>,
    mappingTable: BoneMappingTable
  ): void {
    // Clear previous markers
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.markers.clear();

    const sphereGeo = new THREE.SphereGeometry(0.016, 12, 12);

    for (const [boneName, bone] of bones.entries()) {
      const worldPos = new THREE.Vector3();
      bone.getWorldPosition(worldPos);

      // Determine confidence and canonical assignment
      let confidence = 0.0;
      let matchedCanonical: CanonicalBone | undefined;

      for (const entry of mappingTable.values()) {
        if (entry.sourceBoneName === boneName) {
          confidence = entry.confidence;
          matchedCanonical = entry.canonical;
          break;
        }
      }

      // Color coding: Green (high confidence), Yellow (moderate), Red (unmapped)
      let colorHex = 0xff2244;
      if (confidence >= 0.9) {
        colorHex = 0x00ff88;
      } else if (confidence >= 0.5) {
        colorHex = 0xffbb00;
      }

      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: false,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      });

      const sphere = new THREE.Mesh(sphereGeo, mat);
      sphere.position.copy(worldPos);
      sphere.userData = { boneName, canonical: matchedCanonical };
      this.group.add(sphere);

      this.markers.set(boneName, {
        boneName,
        canonical: matchedCanonical,
        mesh: sphere,
        worldPosition: worldPos,
        confidence,
      });
    }

    this.rebuildBoneConnections(bones);
  }

  private rebuildBoneConnections(bones: Map<string, THREE.Bone>): void {
    const linePositions: number[] = [];

    for (const bone of bones.values()) {
      if (bone.parent && (bone.parent as THREE.Bone).isBone) {
        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();
        bone.getWorldPosition(p1);
        bone.parent.getWorldPosition(p2);

        linePositions.push(p1.x, p1.y, p1.z);
        linePositions.push(p2.x, p2.y, p2.z);
      }
    }

    if (linePositions.length > 0) {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4,
        depthTest: false,
      });
      this.skeletonLines = new THREE.LineSegments(lineGeo, lineMat);
      this.group.add(this.skeletonLines);
    }
  }

  /**
   * Raycast from screen mouse coordinates to select a bone in 3D
   */
  public raycastBone(
    normalizedMouse: THREE.Vector2,
    camera: THREE.Camera
  ): VisualBoneMarker | null {
    this.raycaster.setFromCamera(normalizedMouse, camera);
    const meshes = Array.from(this.markers.values()).map(m => m.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const boneName = hitMesh.userData.boneName;
      this.selectedMarker = this.markers.get(boneName) || null;
      return this.selectedMarker;
    }

    return null;
  }

  public getSelectedMarker(): VisualBoneMarker | null {
    return this.selectedMarker;
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }
}
