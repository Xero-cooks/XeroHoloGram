export class EnvelopeFollower {
  private currentValue: number = 0;
  private attackTime: number; // seconds
  private decayTime: number;  // seconds

  constructor(attackMs: number = 12, decayMs: number = 45) {
    this.attackTime = attackMs / 1000.0;
    this.decayTime = decayMs / 1000.0;
  }

  public step(targetValue: number, dt: number): number {
    const isAttacking = targetValue > this.currentValue;
    const timeConstant = isAttacking ? this.attackTime : this.decayTime;

    // Alpha = 1 - exp(-dt / tau)
    const alpha = 1.0 - Math.exp(-dt / Math.max(timeConstant, 1e-4));
    this.currentValue += (targetValue - this.currentValue) * alpha;

    return this.currentValue;
  }

  public reset(): void {
    this.currentValue = 0;
  }

  public getValue(): number {
    return this.currentValue;
  }
}
