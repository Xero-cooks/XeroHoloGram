import { describe, expect, it } from 'bun:test';
import { SpeechSensor } from '../src/audio/SpeechSensor';

describe('SpeechSensor Hybrid Endpointing & Turn-Taking Engine', () => {
  it('should initialize with custom options and default silence endpoint', () => {
    let startCount = 0;
    let endCount = 0;
    let interimCount = 0;
    let finalCount = 0;

    const sensor = new SpeechSensor(
      {
        onVADSpeechStart: () => { startCount++; },
        onVADSpeechEnd: () => { endCount++; },
        onInterimStable: () => { interimCount++; },
        onFinalTranscript: () => { finalCount++; }
      },
      {
        energyThreshold: 0.02,
        speechHangoverMs: 300,
        silenceEndpointMs: 600,
        language: 'en-US'
      }
    );

    expect(sensor.getIsSpeaking()).toBe(false);
    expect(sensor.getRMS()).toBe(0);

    // Test parameter setters
    sensor.setEnergyThreshold(0.04);
    sensor.setSpeechHangoverMs(400);
    sensor.setSilenceEndpointMs(800);
    sensor.setLanguage('en-GB');

    sensor.stop();
  });

  it('should trigger final transcript when silence endpoint timer elapses', async () => {
    let committedTranscript = '';
    let speechStarted = false;

    const sensor = new SpeechSensor(
      {
        onVADSpeechStart: () => { speechStarted = true; },
        onInterimStable: () => {},
        onFinalTranscript: (text) => { committedTranscript = text; }
      },
      {
        silenceEndpointMs: 60 // Fast 60ms timer for unit testing
      }
    );

    // Simulate incoming interim speech text from browser recognizer
    (sensor as any).handleIncomingSpeechText('What is the hologram status', false);
    expect(speechStarted).toBe(true);
    expect(sensor.getIsSpeaking()).toBe(true);

    // Before endpoint timer elapses, transcript is not committed
    expect(committedTranscript).toBe('');

    // Wait for the silence endpoint timer to trigger commit
    await new Promise(resolve => setTimeout(resolve, 90));

    expect(committedTranscript).toBe('What is the hologram status');
    expect(sensor.getIsSpeaking()).toBe(false);

    sensor.stop();
  });

  it('should immediately commit when browser provides isFinal = true', () => {
    let committedTranscript = '';

    const sensor = new SpeechSensor(
      {
        onVADSpeechStart: () => {},
        onInterimStable: () => {},
        onFinalTranscript: (text) => { committedTranscript = text; }
      },
      {
        silenceEndpointMs: 1500
      }
    );

    // Simulate browser emitting isFinal: true
    (sensor as any).handleIncomingSpeechText('Summon wrist terminal', true);

    // Should commit immediately without waiting for the 1500ms silence timer
    expect(committedTranscript).toBe('Summon wrist terminal');
    expect(sensor.getIsSpeaking()).toBe(false);

    sensor.stop();
  });
});
