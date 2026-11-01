import { describe, expect, it } from 'bun:test';
import { ClientVAD } from '../src/audio/ClientVAD';

describe('Client-Side Voice Activity Detection (VAD)', () => {
  it('should detect speech onset and trigger callback', () => {
    let onsetTriggered = false;
    let offsetTriggered = false;

    const vad = new ClientVAD(
      { energyThreshold: 0.1, speechHangoverMs: 200, minSpeechDurationMs: 50 },
      {
        onSpeechStart: () => { onsetTriggered = true; },
        onSpeechEnd: () => { offsetTriggered = true; }
      }
    );

    // Loud speech frame
    const loudSamples = new Float32Array(512);
    loudSamples.fill(0.3); // RMS = 0.3 > 0.1

    // Frame at t = 0 (first frame)
    vad.processAudioFrame(loudSamples, 0);
    expect(vad.getIsSpeaking()).toBe(false); // Hasn't hit min duration yet

    // Frame at t = 60ms (exceeds minSpeechDurationMs of 50ms)
    vad.processAudioFrame(loudSamples, 60);
    expect(vad.getIsSpeaking()).toBe(true);
    expect(onsetTriggered).toBe(true);

    // Silence frame
    const silentSamples = new Float32Array(512); // All zeros

    // Frame at t = 150ms (inside 200ms hangover)
    vad.processAudioFrame(silentSamples, 150);
    expect(vad.getIsSpeaking()).toBe(true); // Still in hangover period

    // Frame at t = 300ms (exceeded hangover)
    vad.processAudioFrame(silentSamples, 300);
    expect(vad.getIsSpeaking()).toBe(false);
    expect(offsetTriggered).toBe(true);
  });
});
