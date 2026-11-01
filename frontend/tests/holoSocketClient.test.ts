import { describe, it, expect } from 'bun:test';
import { HoloSocketClient } from '../src/network/HoloSocketClient';

describe('HoloSocketClient Multiplexer', () => {
  it('should initialize with default URL and disconnected state', () => {
    const client = new HoloSocketClient();
    expect(client.getRTT()).toBe(0);

    let statusLogged = '';
    client.onStatus((st) => {
      statusLogged = st;
    });

    client.disconnect();
    expect(statusLogged).toBe('disconnected');
  });

  it('should support registering callbacks for kinematics, audio, and RTT', () => {
    const client = new HoloSocketClient();
    const unsubK = client.onKinematics(() => {});
    const unsubA = client.onAudio(() => {});
    const unsubR = client.onRTT(() => {});

    expect(typeof unsubK).toBe('function');
    expect(typeof unsubA).toBe('function');
    expect(typeof unsubR).toBe('function');

    unsubK();
    unsubA();
    unsubR();
  });
});
