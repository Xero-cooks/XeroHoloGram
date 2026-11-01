import { VisemeName, VisemeWeights, ZERO_VISEME_WEIGHTS } from './visemeTypes';
import { SpectralFormants } from './FFTFormantAnalyzer';
import { EnvelopeFollower } from './EnvelopeFollower';

export class FormantToVisemeMapper {
  private envelope: EnvelopeFollower;
  private silenceThreshold: number;

  constructor(silenceThreshold: number = 0.04) {
    this.envelope = new EnvelopeFollower(10, 45);
    this.silenceThreshold = silenceThreshold;
  }

  public mapToVisemes(formants: SpectralFormants, dt: number): VisemeWeights {
    const weights: VisemeWeights = { ...ZERO_VISEME_WEIGHTS };

    // Overall vocal energy envelope
    const smoothedEnergy = this.envelope.step(formants.totalRms, dt);

    if (smoothedEnergy < this.silenceThreshold) {
      weights[VisemeName.sil] = 1.0;
      return weights;
    }

    weights[VisemeName.sil] = Math.max(0, 1.0 - smoothedEnergy * 2.5);

    const { f1Energy, f2Energy, f3Energy } = formants;
    const sum = f1Energy + f2Energy + f3Energy || 1.0;
    const r1 = f1Energy / sum;
    const r2 = f2Energy / sum;
    const r3 = f3Energy / sum;

    // Open vowel (aa) driven by low formant resonance
    weights[VisemeName.aa] = Math.min(Math.max(r1 * 1.5 * smoothedEnergy, 0), 1.0);

    // Front vowels (E, ih) driven by mid formant
    weights[VisemeName.E] = Math.min(Math.max(r2 * 1.2 * smoothedEnergy, 0), 1.0);
    weights[VisemeName.ih] = Math.min(Math.max(r2 * 0.8 * smoothedEnergy, 0), 1.0);

    // Rounded vowel (oh, ou)
    if (r1 > 0.4 && r2 < 0.3) {
      weights[VisemeName.oh] = Math.min(Math.max(r1 * smoothedEnergy, 0), 1.0);
    }

    // Fricatives and sibilants (SS, FF, CH) driven by high formant
    weights[VisemeName.SS] = Math.min(Math.max(r3 * 1.8 * smoothedEnergy, 0), 1.0);
    weights[VisemeName.FF] = Math.min(Math.max(r3 * 0.9 * smoothedEnergy, 0), 1.0);

    return weights;
  }

  public reset(): void {
    this.envelope.reset();
  }
}
