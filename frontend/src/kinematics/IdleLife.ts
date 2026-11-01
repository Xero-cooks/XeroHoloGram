import { Joint28 } from '../rig/CanonicalSkeleton';

export interface IdleOffsets {
  jointOffsets: Map<Joint28, [number, number, number]>;
  eyeBlinkWeight: number;
}

export class IdleLifeGenerator {
  private breathingFrequencyHz: number = 0.24; // 0.24 Hz thoracic breathing
  private nextSaccadeTime: number = 0;
  private currentSaccadeOffset: [number, number] = [0, 0];
  private nextBlinkTime: number = 0;
  private blinkWeight: number = 0;

  constructor() {
    this.scheduleNextSaccade(0);
    this.scheduleNextBlink(0);
  }

  private scheduleNextSaccade(currentTime: number): void {
    const u = Math.max(Math.random(), 1e-4);
    this.nextSaccadeTime = currentTime + Math.min(Math.max(-Math.log(u) * 2.5, 0.5), 5.0);
    this.currentSaccadeOffset = [
      (Math.random() - 0.5) * 4.0, // +/- 2 deg pitch
      (Math.random() - 0.5) * 6.0  // +/- 3 deg yaw
    ];
  }

  private scheduleNextBlink(currentTime: number): void {
    const u = Math.max(Math.random(), 1e-4);
    this.nextBlinkTime = currentTime + Math.min(Math.max(-Math.log(u) * 3.5, 1.2), 7.0);
  }

  public update(timeSeconds: number, delta: number): IdleOffsets {
    const offsets = new Map<Joint28, [number, number, number]>();

    // 1. Thoracic breathing wave at 0.24 Hz
    const breathPhase = 2.0 * Math.PI * this.breathingFrequencyHz * timeSeconds;
    const breath = Math.sin(breathPhase);

    // Modulate spine_01, spine_02, and clavicles
    offsets.set(Joint28.spine_01, [breath * 1.2, 0, 0]);
    offsets.set(Joint28.spine_02, [breath * 1.8, 0, 0]);
    offsets.set(Joint28.clavicle_L, [0, 0, breath * 1.5]);
    offsets.set(Joint28.clavicle_R, [0, 0, -breath * 1.5]);

    // 2. Poisson Micro-Saccades on head/neck
    if (timeSeconds >= this.nextSaccadeTime) {
      this.scheduleNextSaccade(timeSeconds);
    }
    offsets.set(Joint28.head, [this.currentSaccadeOffset[0], this.currentSaccadeOffset[1], 0]);
    offsets.set(Joint28.neck, [this.currentSaccadeOffset[0] * 0.5, this.currentSaccadeOffset[1] * 0.5, 0]);

    // 3. Poisson Eye Blinks
    if (timeSeconds >= this.nextBlinkTime) {
      this.blinkWeight = 1.0;
      this.scheduleNextBlink(timeSeconds);
    } else if (this.blinkWeight > 0) {
      this.blinkWeight = Math.max(0, this.blinkWeight - delta * 6.0); // 160ms blink duration
    }

    return {
      jointOffsets: offsets,
      eyeBlinkWeight: this.blinkWeight,
    };
  }
}
