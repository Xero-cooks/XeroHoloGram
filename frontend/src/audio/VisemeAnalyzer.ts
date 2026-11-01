export interface VisemeFrame {
  viseme_aa: number; // Jaw drop (E_low)
  viseme_ee: number; // Lip corner spread (E_mid)
  viseme_ss: number; // Fricative constriction (E_high)
  jawPitchRad: number;
  forearmBeatOffsetRad: number;
  neckBeatOffsetRad: number;
  rmsEnergy: number;
}

export class VisemeAnalyzer {
  private sampleRate: number;
  private fftSize: number;
  private binWidth: number;
  private beatPhase: number = 0;
  private beatFrequency: number = 3.2; // ~3.2 Hz rhythmic conversational pacing

  constructor(sampleRate: number = 24000, fftSize: number = 512) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
    this.binWidth = sampleRate / fftSize;
  }

  public analyze(frequencyData: Uint8Array, delta: number): VisemeFrame {
    let eLowSum = 0;
    let eLowCount = 0;
    let eMidSum = 0;
    let eMidCount = 0;
    let eHighSum = 0;
    let eHighCount = 0;
    let totalSum = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * this.binWidth;
      const val = frequencyData[i] / 255.0;
      totalSum += val * val;

      if (freq >= 100 && freq < 450) {
        eLowSum += val;
        eLowCount++;
      } else if (freq >= 450 && freq < 2200) {
        eMidSum += val;
        eMidCount++;
      } else if (freq >= 2200 && freq < 6500) {
        eHighSum += val;
        eHighCount++;
      }
    }

    const eLow = eLowCount > 0 ? eLowSum / eLowCount : 0;
    const eMid = eMidCount > 0 ? eMidSum / eMidCount : 0;
    const eHigh = eHighCount > 0 ? eHighSum / eHighCount : 0;
    const rms = Math.sqrt(totalSum / (frequencyData.length || 1));

    // Jaw rotation driven by low energy (0 - 18 deg)
    const jawPitchRad = eLow * (18.0 * Math.PI) / 180.0;

    // Prosody Beat Coupling: Delta_theta = kappa * E_RMS(t) * sin(omega_b * t)
    this.beatPhase += this.beatFrequency * 2.0 * Math.PI * delta;
    const beatSin = Math.sin(this.beatPhase);
    const forearmBeatOffsetRad = 0.35 * rms * beatSin;
    const neckBeatOffsetRad = 0.15 * rms * beatSin;

    return {
      viseme_aa: Math.min(eLow * 1.5, 1.0),
      viseme_ee: Math.min(eMid * 1.2, 1.0),
      viseme_ss: Math.min(eHigh * 1.8, 1.0),
      jawPitchRad,
      forearmBeatOffsetRad,
      neckBeatOffsetRad,
      rmsEnergy: rms,
    };
  }
}
