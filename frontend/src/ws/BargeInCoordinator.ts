import { HologramWSClient } from './HologramWSClient';
import { AudioJitterBuffer } from '../audio/AudioJitterBuffer';
import { WebAudioManager } from '../audio/WebAudioManager';
import { MotionBlendEngine } from '../kinematics/MotionBlendEngine';
import { ProceduralGestures } from '../kinematics/ProceduralGestures';

export class BargeInCoordinator {
  private wsClient: HologramWSClient;
  private jitterBuffer: AudioJitterBuffer;
  private audioManager: WebAudioManager;
  private motionEngine: MotionBlendEngine;
  private sessionId: string;

  constructor(
    wsClient: HologramWSClient,
    jitterBuffer: AudioJitterBuffer,
    audioManager: WebAudioManager,
    motionEngine: MotionBlendEngine,
    sessionId: string = 'sess_default'
  ) {
    this.wsClient = wsClient;
    this.jitterBuffer = jitterBuffer;
    this.audioManager = audioManager;
    this.motionEngine = motionEngine;
    this.sessionId = sessionId;
  }

  /**
   * Executes sub-50ms barge-in interruption sequence
   */
  public triggerBargeIn(): void {
    const timestamp = Date.now();

    // 1. Immediately mute and flush audio buffers
    this.jitterBuffer.flush();
    this.audioManager.setMute(true);

    // 2. Dispatch barge-in packet to server
    this.wsClient.sendJSON({
      type: 'barge_in',
      session_id: this.sessionId,
      timestamp_ms: timestamp,
    });

    // 3. Reset avatar posture to attentive listening gesture
    const listeningPose = ProceduralGestures.getGesture('listening');
    this.motionEngine.setGesture(listeningPose.rotations);

    // 4. Unmute audio channel for subsequent turn after slight delay
    setTimeout(() => {
      this.audioManager.setMute(false);
    }, 150);
  }
}
