import * as THREE from 'three';
import { CanonicalBone } from '../rig/canonicalBones';
import { SO3SpringDamper } from './SO3SpringDamper';
import { BreathingOscillator } from './BreathingOscillator';
import { LookAtGazeSolver } from './LookAtGazeSolver';
import { EyeSaccadeGenerator } from './EyeSaccadeGenerator';
import { JointLimitClamper } from './JointLimitClamper';

export class MotionBlendEngine {
  private boneSolvers: Map<CanonicalBone, SO3SpringDamper> = new Map();
  private breathing: BreathingOscillator;
  private saccades: EyeSaccadeGenerator;
  private currentGestureRotations: Map<CanonicalBone, THREE.Quaternion> = new Map();
  private gazeTarget: THREE.Vector3 = new THREE.Vector3(0, 1.5, 2.0);

  constructor() {
    this.breathing = new BreathingOscillator();
    this.saccades = new EyeSaccadeGenerator();

    // Initialize 60Hz SO(3) spring-dampers for all canonical bones
    for (const bone of Object.values(CanonicalBone)) {
      this.boneSolvers.set(bone as CanonicalBone, new SO3SpringDamper());
    }
  }

  public setGesture(rotations: Map<CanonicalBone, THREE.Quaternion>): void {
    this.currentGestureRotations = new Map(rotations);
  }

  public setGazeTarget(target: THREE.Vector3): void {
    this.gazeTarget.copy(target);
  }

  /**
   * Evaluates all layers and advances the 60Hz spring damper physics step
   */
  public update(
    currentTime: number,
    delta: number,
    headWorldPos: THREE.Vector3 = new THREE.Vector3(0, 1.45, 0),
    avatarQuat: THREE.Quaternion = new THREE.Quaternion()
  ): Map<CanonicalBone, THREE.Quaternion> {
    const finalRotations = new Map<CanonicalBone, THREE.Quaternion>();

    // Layer 1: Breathing
    const breath = this.breathing.evaluate(currentTime);
    const chestBreathQ = this.breathing.getQuaternionOffset(breath.chestPitchOffset);
    const spineBreathQ = this.breathing.getQuaternionOffset(breath.spinePitchOffset);

    // Layer 3: Gaze & Look-At
    const gaze = LookAtGazeSolver.solveLookAt(this.gazeTarget, headWorldPos, avatarQuat);

    // Layer 3b: Eye Saccades
    const saccade = this.saccades.update(currentTime, delta);
    const eyeSaccadeQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(saccade.pitch, saccade.yaw, 0));

    // Composite and step each bone solver
    for (const [bone, solver] of this.boneSolvers.entries()) {
      let targetQ = new THREE.Quaternion();

      // Apply breathing
      if (bone === CanonicalBone.Chest) {
        targetQ.multiply(chestBreathQ);
      } else if (bone === CanonicalBone.Spine) {
        targetQ.multiply(spineBreathQ);
      }

      // Apply gesture layer
      if (this.currentGestureRotations.has(bone)) {
        targetQ.multiply(this.currentGestureRotations.get(bone)!);
      }

      // Apply gaze layer
      if (gaze.rotations.has(bone)) {
        targetQ.multiply(gaze.rotations.get(bone)!);
      }

      // Apply saccadic micro-drift
      if (bone === CanonicalBone.LeftEye || bone === CanonicalBone.RightEye) {
        targetQ.multiply(eyeSaccadeQ);
      }

      // Enforce anatomical limits
      const clampedTarget = JointLimitClamper.clampQuaternion(bone, targetQ);

      solver.setTarget(clampedTarget);
      solver.step(delta);

      finalRotations.set(bone, solver.currentRotation.clone());
    }

    return finalRotations;
  }
}
