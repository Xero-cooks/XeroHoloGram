import { describe, expect, it } from 'bun:test';
import { EnvelopeFollower } from '../src/audio/EnvelopeFollower';
import { TimestampLipSync } from '../src/audio/TimestampLipSync';
import { AudioJitterBuffer } from '../src/audio/AudioJitterBuffer';
import { VisemeName } from '../src/audio/visemeTypes';

describe('Envelope Follower Dynamics', () => {
  it('should attack faster than it decays', () => {
    const follower = new EnvelopeFollower(10, 50); // 10ms attack, 50ms decay
    const dt = 0.01; // 10ms

    // Attack step from 0 to 1
    const attackVal = follower.step(1.0, dt);
    expect(attackVal).toBeGreaterThan(0.5); // Fast rise

    // Now decay step from attackVal towards 0
    const decayVal = follower.step(0.0, dt);
    const drop = attackVal - decayVal;
    const rise = attackVal;

    expect(rise).toBeGreaterThan(drop); // Rise rate is steeper than drop rate
  });
});

describe('Timestamp Lip-Sync Interpolator', () => {
  it('should activate appropriate viseme during time window and silence outside', () => {
    const interpolator = new TimestampLipSync();
    interpolator.loadTimestamps([
      { phoneme: 'aa', viseme: VisemeName.aa, startMs: 100, endMs: 300 }
    ]);

    // Outside window
    const before = interpolator.evaluate(50);
    expect(before[VisemeName.sil]).toBe(1.0);
    expect(before[VisemeName.aa]).toBe(0.0);

    // Peak inside window (midpoint = 200ms)
    const mid = interpolator.evaluate(200);
    expect(mid[VisemeName.aa]).toBeGreaterThan(0.9);
    expect(mid[VisemeName.sil]).toBeLessThan(0.1);
  });
});

describe('Audio Jitter Buffer', () => {
  it('should buffer chunks, compute duration, and instantly flush', () => {
    const buffer = new AudioJitterBuffer(24000, 60);
    const chunk = new Float32Array(2400); // 100ms at 24kHz

    buffer.pushChunk(chunk);
    expect(buffer.getQueueLength()).toBe(1);
    expect(buffer.getBufferedDurationMs()).toBeCloseTo(100, 1);
    expect(buffer.isReadyToPlay()).toBe(true);

    const pulled = buffer.pullChunk();
    expect(pulled?.length).toBe(2400);
    expect(buffer.getQueueLength()).toBe(0);

    // Test flush
    buffer.pushChunk(chunk);
    buffer.flush();
    expect(buffer.getQueueLength()).toBe(0);
    expect(buffer.getBufferedDurationMs()).toBe(0);
  });
});
