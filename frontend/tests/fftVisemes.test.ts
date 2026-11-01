import { describe, expect, it } from 'bun:test';
import { FFTFormantAnalyzer } from '../src/audio/FFTFormantAnalyzer';
import { FormantToVisemeMapper } from '../src/audio/FormantToVisemeMapper';
import { VisemeName } from '../src/audio/visemeTypes';

describe('FFT Formant Analyzer & Viseme Mapper', () => {
  it('should detect low formant energy and map to open vowel', () => {
    const analyzer = new FFTFormantAnalyzer(24000, 512);
    const mapper = new FormantToVisemeMapper(0.02);

    // Simulate spectrum with strong low formant (around 400 Hz)
    const freqData = new Uint8Array(256);
    // Bin index for 400 Hz: 400 / (24000 / 512) ~ 8.5
    for (let i = 5; i <= 12; i++) {
      freqData[i] = 220;
    }

    const formants = analyzer.analyzeFrequencies(freqData);
    expect(formants.f1Energy).toBeGreaterThan(formants.f3Energy);

    const weights = mapper.mapToVisemes(formants, 0.05);
    expect(weights[VisemeName.aa]).toBeGreaterThan(0.1);
  });

  it('should map high frequency sibilant energy to SS viseme', () => {
    const analyzer = new FFTFormantAnalyzer(24000, 512);
    const mapper = new FormantToVisemeMapper(0.02);

    // Simulate high frequency hiss (3000 Hz): bin index ~ 64
    const freqData = new Uint8Array(256);
    for (let i = 55; i <= 75; i++) {
      freqData[i] = 240;
    }

    const formants = analyzer.analyzeFrequencies(freqData);
    expect(formants.f3Energy).toBeGreaterThan(formants.f1Energy);

    const weights = mapper.mapToVisemes(formants, 0.05);
    expect(weights[VisemeName.SS]).toBeGreaterThan(0.1);
  });

  it('should return silence viseme for zero energy input', () => {
    const analyzer = new FFTFormantAnalyzer(24000, 512);
    const mapper = new FormantToVisemeMapper(0.03);

    const freqData = new Uint8Array(256); // All zeroes
    const formants = analyzer.analyzeFrequencies(freqData);
    const weights = mapper.mapToVisemes(formants, 0.05);

    expect(weights[VisemeName.sil]).toBe(1.0);
    expect(weights[VisemeName.aa]).toBe(0.0);
  });
});
