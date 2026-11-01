import * as THREE from 'three';
import { CanonicalBone } from '../rig/canonicalBones';

export type GestureType = 'greeting' | 'thinking' | 'asserting' | 'questioning' | 'listening' | 'idle';

export interface GesturePose {
  durationMs: number;
  rotations: Map<CanonicalBone, THREE.Quaternion>;
}

export class ProceduralGestures {
  private static readonly DEG2RAD = Math.PI / 180.0;

  public static getGesture(type: GestureType): GesturePose {
    const map = new Map<CanonicalBone, THREE.Quaternion>();
    const d2r = this.DEG2RAD;

    switch (type) {
      case 'greeting': {
        // Polite nod + right hand open
        map.set(CanonicalBone.Head, new THREE.Quaternion().setFromEuler(new THREE.Euler(12 * d2r, 0, 0)));
        map.set(CanonicalBone.RightUpperArm, new THREE.Quaternion().setFromEuler(new THREE.Euler(-25 * d2r, 15 * d2r, -20 * d2r)));
        map.set(CanonicalBone.RightLowerArm, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 30 * d2r, 0)));
        return { durationMs: 1200, rotations: map };
      }
      case 'thinking': {
        // Head tilted up and to the side
        map.set(CanonicalBone.Neck, new THREE.Quaternion().setFromEuler(new THREE.Euler(-8 * d2r, -10 * d2r, 8 * d2r)));
        map.set(CanonicalBone.Head, new THREE.Quaternion().setFromEuler(new THREE.Euler(-10 * d2r, -5 * d2r, 5 * d2r)));
        return { durationMs: 1500, rotations: map };
      }
      case 'asserting': {
        // Confident forward nod
        map.set(CanonicalBone.Chest, new THREE.Quaternion().setFromEuler(new THREE.Euler(4 * d2r, 0, 0)));
        map.set(CanonicalBone.Head, new THREE.Quaternion().setFromEuler(new THREE.Euler(15 * d2r, 0, 0)));
        return { durationMs: 800, rotations: map };
      }
      case 'questioning': {
        // Head tilted curiously
        map.set(CanonicalBone.Head, new THREE.Quaternion().setFromEuler(new THREE.Euler(-4 * d2r, 8 * d2r, -12 * d2r)));
        return { durationMs: 1000, rotations: map };
      }
      case 'listening': {
        // Attentive tilt with subtle nod
        map.set(CanonicalBone.Neck, new THREE.Quaternion().setFromEuler(new THREE.Euler(6 * d2r, 4 * d2r, -4 * d2r)));
        map.set(CanonicalBone.Head, new THREE.Quaternion().setFromEuler(new THREE.Euler(4 * d2r, 2 * d2r, -2 * d2r)));
        return { durationMs: 600, rotations: map };
      }
      case 'idle':
      default:
        return { durationMs: 500, rotations: map };
    }
  }
}
