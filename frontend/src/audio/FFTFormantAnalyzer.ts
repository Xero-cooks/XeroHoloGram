export interface SpectralFormants {
  f1Energy: number; // Low band (150 - 800 Hz)
  f2Energy: number; // Mid band (800 - 2200 Hz)
  f3Energy: number; // High band (2200 - 4500 Hz)
  totalRms: number;
}

export class FFTFormantAnalyzer {
  private sampleRate: number;
  private fftSize: number;
  private binWidth: number;

  constructor(sampleRate: number = 24000, fftSize: number = 512) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
    this.binWidth = sampleRate / fftSize;
  }

  /**
   * Partitions frequency domain byte data into normalized formant bands
   * @param frequencyData Uint8Array from AnalyserNode.getByteFrequencyData()
   */
  public analyzeFrequencies(frequencyData: Uint8Array): SpectralFormants {
    let f1Sum = 0;
    let f1Count = 0;
    let f2Sum = 0;
    let f2Count = 0;
    let f3Sum = 0;
    let f3Count = 0;
    let totalSum = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * this.binWidth;
      const val = frequencyData[i] / 255.0; // Normalize 0..1
      totalSum += val * val;

      if (freq >= 150 && freq < 800) {
        f1Sum += val;
        f1Count++;
      } else if (freq >= 800 && freq < 2200) {
        f2Sum += val;
        f2Count++;
      } else if (freq >= 2200 && freq < 4500) {
        f3Sum += val;
        f3Count++;
      }
    }

    const f1 = f1Count > 0 ? f1Sum / f1Count : 0;
    const f2 = f2Count > 0 ? f2Sum / f2Count : 0;
    const f3 = f3Count > 0 ? f3Sum / f3Count : 0;
    const rms = Math.sqrt(totalSum / (frequencyData.length || 1));

    return {
      f1Energy: f1,
      f2Energy: f2,
      f3Energy: f3,
      totalRms: rms,
    };
  }
}
