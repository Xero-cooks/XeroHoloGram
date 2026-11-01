import { VisemeName, VisemeWeights, ZERO_VISEME_WEIGHTS } from './visemeTypes';
import { FormantToVisemeMapper } from './FormantToVisemeMapper';
import { TimestampLipSync, PhonemeTimestamp } from './TimestampLipSync';
import { SpectralFormants } from './FFTFormantAnalyzer';

export class HybridLipSyncEngine {
  private timestampEngine: TimestampLipSync;
  private fftMapper: FormantToVisemeMapper;
  private hasTimestamps: boolean = false;
  private crossfadeWeight: number = 0.0; // 0 = FFT, 1 = Timestamps

  constructor() {
    this.timestampEngine = new TimestampLipSync();
    this.fftMapper = new FormantToVisemeMapper();
  }

  public setTimestamps(timestamps: PhonemeTimestamp[]): void {
    this.timestampEngine.loadTimestamps(timestamps);
    this.hasTimestamps = timestamps.length > 0;
  }

  public clearTimestamps(): void {
    this.timestampEngine.clear();
    this.hasTimestamps = false;
    this.crossfadeWeight = 0.0;
  }

  public evaluate(
    formants: SpectralFormants,
    currentPlaybackMs: number,
    dt: number
  ): VisemeWeights {
    // Target crossfade
    const targetCrossfade = this.hasTimestamps ? 1.0 : 0.0;
    this.crossfadeWeight += (targetCrossfade - this.crossfadeWeight) * Math.min(dt * 8.0, 1.0);

    const fftWeights = this.fftMapper.mapToVisemes(formants, dt);
    const tsWeights = this.hasTimestamps
      ? this.timestampEngine.evaluate(currentPlaybackMs)
      : ZERO_VISEME_WEIGHTS;

    // Blend between modes
    const result: VisemeWeights = { ...ZERO_VISEME_WEIGHTS };
    const w = this.crossfadeWeight;

    for (const key of Object.values(VisemeName)) {
      result[key] = (1.0 - w) * (fftWeights[key] || 0) + w * (tsWeights[key] || 0);
    }

    return result;
  }
}
