import { VisemeName, VisemeWeights, ZERO_VISEME_WEIGHTS } from './visemeTypes';

export interface PhonemeTimestamp {
  phoneme: string;
  viseme: VisemeName;
  startMs: number;
  endMs: number;
}

export class TimestampLipSync {
  private queue: PhonemeTimestamp[] = [];

  public loadTimestamps(timestamps: PhonemeTimestamp[]): void {
    this.queue = [...timestamps].sort((a, b) => a.startMs - b.startMs);
  }

  public clear(): void {
    this.queue = [];
  }

  public evaluate(currentPlaybackMs: number): VisemeWeights {
    const weights: VisemeWeights = { ...ZERO_VISEME_WEIGHTS };

    // Find active phoneme
    const active = this.queue.find(
      p => currentPlaybackMs >= p.startMs && currentPlaybackMs <= p.endMs
    );

    if (!active) {
      weights[VisemeName.sil] = 1.0;
      return weights;
    }

    // Coarticulation Hermite interpolation
    const duration = active.endMs - active.startMs || 1;
    const t = (currentPlaybackMs - active.startMs) / duration;
    // Bell curve weight profile
    const curve = Math.sin(t * Math.PI);

    weights[VisemeName.sil] = 1.0 - curve;
    weights[active.viseme] = curve;

    return weights;
  }
}
