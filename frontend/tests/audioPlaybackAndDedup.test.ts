import { describe, it, expect } from 'bun:test';
import { HoloSocketClient } from '../src/network/HoloSocketClient';
import { SpeechSensor } from '../src/audio/SpeechSensor';

describe('Audio Playback Routing & Dedup Verification', () => {
  it('should route compressed MP3 audio only to rawAudioCallbacks and not audioCallbacks', () => {
    const client = new HoloSocketClient('ws://localhost:8765/ws/hologram');
    let rawCount = 0;
    let pcmCount = 0;

    client.onRawAudio(() => {
      rawCount++;
    });

    client.onAudio(() => {
      pcmCount++;
    });

    // Create 16-byte header + MP3 Sync Word (0xFF 0xFB)
    const buffer = new ArrayBuffer(16 + 8);
    const view = new DataView(buffer);
    view.setUint32(0, 1, true); // seqId
    view.setUint32(4, 24000, true); // sampleRate
    view.setUint32(8, 4, true); // numSamples
    view.setUint32(12, 0, true); // flags

    const u8 = new Uint8Array(buffer, 16);
    u8[0] = 0xFF;
    u8[1] = 0xFB; // MPEG-1 Layer 3 sync

    (client as any).handleBinaryAudio(buffer);

    expect(rawCount).toBe(1);
    expect(pcmCount).toBe(0); // MUST NEVER be dispatched as PCM to prevent digital clipping screeches
  });

  it('should route genuine PCM audio only to audioCallbacks and not rawAudioCallbacks', () => {
    const client = new HoloSocketClient('ws://localhost:8765/ws/hologram');
    let rawCount = 0;
    let pcmCount = 0;

    client.onRawAudio(() => {
      rawCount++;
    });

    client.onAudio(() => {
      pcmCount++;
    });

    // Create 16-byte header + standard 16-bit PCM samples (no MP3/ID3 header)
    const buffer = new ArrayBuffer(16 + 8);
    const view = new DataView(buffer);
    view.setUint32(0, 2, true);
    view.setUint32(4, 24000, true);
    view.setUint32(8, 4, true);
    view.setUint32(12, 0, true);

    const int16 = new Int16Array(buffer, 16);
    int16[0] = 1000;
    int16[1] = -1000;

    (client as any).handleBinaryAudio(buffer);

    expect(pcmCount).toBe(1);
    expect(rawCount).toBe(0); // MUST NOT double-dispatch to raw to prevent dueling audio playback
  });

  it('should suppress duplicate turn commits within cooldown window', () => {
    let commitCount = 0;
    let lastTranscript = '';

    const sensor = new SpeechSensor({
      onVADSpeechStart: () => {},
      onInterimStable: () => {},
      onFinalTranscript: (txt) => {
        commitCount++;
        lastTranscript = txt;
      }
    });

    // First commit
    (sensor as any).commitFinalTurn('What is the Pepper Ghost angle?');
    expect(commitCount).toBe(1);
    expect(lastTranscript).toBe('What is the Pepper Ghost angle?');

    // Duplicate commit arriving immediately (e.g. from overlapping browser event or silence timer)
    (sensor as any).commitFinalTurn('what is the pepper ghost angle.');
    expect(commitCount).toBe(1); // Suppressed!

    // Different text commits normally
    (sensor as any).commitFinalTurn('Now summon the wrist terminal.');
    expect(commitCount).toBe(2);
    expect(lastTranscript).toBe('Now summon the wrist terminal.');
  });
});
