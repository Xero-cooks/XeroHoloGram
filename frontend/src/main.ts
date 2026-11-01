import * as THREE from 'three';
import './styles/holo-ui.css';
import { DEFAULT_STAGE_CONFIG } from './config/stageConfig';
import { HologramStage } from './renderer/HologramStage';
import { HoloParticles } from './renderer/HoloParticles';
import { ProceduralRig, XeroKratosRig } from './rig/ProceduralRig';
import { Joint28 } from './rig/CanonicalSkeleton';
import { SpringSolver } from './kinematics/SpringSolver';
import { IdleLifeGenerator } from './kinematics/IdleLife';
import { PoseBlender } from './kinematics/PoseBlender';
import { AudioStreamPlayer } from './audio/AudioStreamPlayer';
import { VisemeAnalyzer } from './audio/VisemeAnalyzer';
import { SpeechSensor } from './audio/SpeechSensor';
import { HoloSocketClient, D3KinematicPacket } from './network/HoloSocketClient';
import { FloatingWidgets } from './shaders/FloatingWidgets';
import { RigStudioDrawer } from './ui/RigStudioDrawer';
import { StageCalibPanel, StageCalibSettings } from './ui/StageCalibPanel';
import { TelemetryHUD } from './ui/TelemetryHUD';
import { LoadedRiggedModel } from './rig/UniversalModelLoader';

/**
 * XeroHoloGram Main Application Bootstrapper
 * Orchestrates 60 FPS WebGL Hologram Viewport, SO(3) Kinematics,
 * Multi-Format 3D Model Ingestion, and Full-Duplex Dual-Stream Audio/D3 WebSocket.
 */
async function bootstrapHologramApp() {
  const container = document.getElementById('hologram-viewport');
  if (!container) return;

  // 1. Initialize Stage & Holographic Camera
  const stage = new HologramStage(container, DEFAULT_STAGE_CONFIG);

  // 2. Ambient Holographic Dust & Flashy Concentric Stage Pedestal
  const particles = new HoloParticles(200);
  stage.scene.add(particles.group);

  // 3. Default Procedural Rig (XeroKratos)
  let proceduralRig: XeroKratosRig = ProceduralRig.createXeroKratos();
  let activeModelRoot: THREE.Object3D = proceduralRig.root;
  let activeBones: Map<Joint28, THREE.Bone> = proceduralRig.bones;
  let activeJawBone: THREE.Bone | null = proceduralRig.jawBone;
  let isCustomLoaded: boolean = false;
  stage.scene.add(proceduralRig.root);

  // 4. Floating Cybernetic Hologram Widgets
  const floatingWidgets = new FloatingWidgets();
  stage.scene.add(floatingWidgets.group);

  // 5. Kinematics Stack (60Hz Critically Damped Spring Solver + Idle Life)
  const springSolver = new SpringSolver();
  const idleLife = new IdleLifeGenerator();
  let currentBasePose: string = 'neutral';
  let currentOverrides: Record<string, [number, number, number]> = {};
  let currentBlendWeight: number = 1.0;

  // 6. Audio Playback & Viseme Synthesis
  const audioPlayer = new AudioStreamPlayer(24000);
  const visemeAnalyzer = new VisemeAnalyzer(24000, 512);

  // 7. Full-Duplex Multiplexer WebSocket Client
  const wsClient = new HoloSocketClient(DEFAULT_STAGE_CONFIG.wsEndpoint);

  // 8. Telemetry HUD & Diagnostics
  const telemetryHUD = new TelemetryHUD();

  // 9. Speech Sensor (Web Speech STT + WebAudio VAD)
  const speechSensor = new SpeechSensor({
    onVADSpeechStart: () => {
      // Immediate Barge-In reflex (<30ms)
      if (audioPlayer.getPlaybackRemainingSec() > 0.05) {
        audioPlayer.flush();
        wsClient.sendBargeIn();
        floatingWidgets.log('[BARGE-IN] Interrupted speech playback');
        telemetryHUD.updateData({ speechState: 'INTERRUPTED' });
      } else {
        telemetryHUD.updateData({ speechState: 'LISTENING' });
      }

      // Transition to listening_attentive pose
      currentBasePose = 'listening_attentive';
      currentOverrides = {};
    },
    onInterimStable: (interimText: string) => {
      telemetryHUD.updateData({ speechState: 'SPECULATIVE' });
      wsClient.sendTranscript(interimText, false);
      floatingWidgets.log(`[STT INTERIM] "${interimText}"`);
    },
    onFinalTranscript: (finalText: string) => {
      telemetryHUD.updateData({ speechState: 'SPEAKING' });
      wsClient.sendTranscript(finalText, true);
      floatingWidgets.log(`[STT FINAL] "${finalText}"`);
    }
  });

  // 10. Wire WebSocket Handlers
  wsClient.onStatus((status) => {
    floatingWidgets.log(`[WS] Status changed: ${status.toUpperCase()}`);
    if (status === 'connected') {
      telemetryHUD.updateData({ shaderState: 'cyan_nominative' });
    }
  });

  wsClient.onRTT((rttMs) => {
    telemetryHUD.updateData({ rttMs });
  });

  wsClient.onAudio((_header, pcmSamples) => {
    audioPlayer.playChunk(pcmSamples);
    telemetryHUD.updateData({ speechState: 'SPEAKING' });
  });

  let gestureKeyframeQueue: Array<{
    triggerMs: number;
    durationMs: number;
    preset: string;
    weight: number;
    overrides: Record<string, [number, number, number]>;
  }> = [];
  let gestureStartTime = performance.now();

  wsClient.onKinematics((packet: D3KinematicPacket) => {
    telemetryHUD.updateData({
      intentClass: packet.intent_class,
      emotion: packet.emotion,
      shaderState: packet.holo_shader_state,
      d3LatencyMs: Math.round(packet.gesture_sequence.length ? 120 : 80)
    });

    floatingWidgets.log(`[D3] Intent: ${packet.intent_class} (${packet.emotion})`);

    // Handle tool summon / terminal intent
    if (packet.intent_class.includes('terminal') || packet.intent_class.includes('architecture')) {
      floatingWidgets.setTerminalVisible(true);
    }

    if (packet.intent_class.includes('sub_agent') || packet.intent_class.includes('tool')) {
      const subId = `worker-${Math.floor(Math.random() * 900 + 100)}`;
      floatingWidgets.spawnSubAgent(subId, 'Reasoner-Node');
      setTimeout(() => floatingWidgets.dismissSubAgent(subId), 4000);
    }

    // Queue gesture sequence
    gestureStartTime = performance.now();
    gestureKeyframeQueue = packet.gesture_sequence.map(kf => ({
      triggerMs: kf.trigger_ms,
      durationMs: kf.duration_ms,
      preset: kf.base_preset,
      weight: kf.blend_weight,
      overrides: kf.bone_angle_overrides_deg || {}
    }));
  });

  wsClient.connect();

  // 11. Multi-Format Rig Studio & Model Configuration Drawer
  const rigDrawer = new RigStudioDrawer({
    onBoneSelect: (boneName) => {
      floatingWidgets.log(`Selected bone: ${boneName}`);
    },
    onTestAngleChange: (boneName, eulerDeg) => {
      if (boneName in Joint28) {
        springSolver.setTargetDeg(boneName as Joint28, eulerDeg);
      }
    },
    onModelLoaded: (customModel: LoadedRiggedModel) => {
      // Unmount previous avatar
      stage.scene.remove(activeModelRoot);

      // Mount new custom model
      activeModelRoot = customModel.root;
      activeBones = customModel.canonicalJointMap || new Map();
      activeJawBone = customModel.canonicalJointMap?.get(Joint28.jaw) || null;
      isCustomLoaded = true;

      stage.scene.add(customModel.root);
      const polyCount = customModel.stats?.triangleCount ? customModel.stats.triangleCount.toLocaleString() : 'N/A';
      floatingWidgets.log(`[MODEL LOADED] Ingested ${customModel.root.name} (${polyCount} polys, ${customModel.bones.size} bones)`);
    },
    onResetToDefaultRig: () => {
      stage.scene.remove(activeModelRoot);
      activeModelRoot = proceduralRig.root;
      activeBones = proceduralRig.bones;
      activeJawBone = proceduralRig.jawBone;
      isCustomLoaded = false;
      stage.scene.add(proceduralRig.root);
      floatingWidgets.log('[MODEL] Restored default XeroKratos procedural avatar');
    },
    onModelTransformChange: (scale, offsetY, rotYDeg) => {
      if (activeModelRoot) {
        activeModelRoot.scale.setScalar(scale);
        activeModelRoot.position.y = offsetY;
        activeModelRoot.rotation.y = (rotYDeg * Math.PI) / 180;
      }
    },
    onShaderPaletteChange: (hexColor) => {
      proceduralRig.setShaderColor?.(hexColor);
      floatingWidgets.log(`[FX] Palette changed: 0x${hexColor.toString(16).padStart(6, '0')}`);
    },
    onParticleIntensityChange: (opacity) => {
      particles.setIntensity(opacity);
    }
  });

  // Populate joints list with canonical bones
  const detectedNames = Array.from(proceduralRig.bones.keys());
  const initialMap: Record<string, string> = {};
  detectedNames.forEach(name => { initialMap[name] = name; });
  rigDrawer.populateJoints(detectedNames, initialMap);

  // 12. Optical Stage Calibrator
  const calibPanel = new StageCalibPanel({
    onChange: (settings: StageCalibSettings) => {
      stage.camera.fov = settings.compensatedFovDeg;
      stage.camera.updateProjectionMatrix();
      stage.updateConfig({
        ...DEFAULT_STAGE_CONFIG,
        optical: {
          ...DEFAULT_STAGE_CONFIG.optical,
          flipX: settings.flipX,
          flipY: settings.flipY,
        }
      });
      floatingWidgets.log(`[CALIB] Reflector: ${settings.glassAngleDeg}°, FOV: ${settings.compensatedFovDeg}°`);
    }
  });

  // 13. Sleek Floating Command Bar
  const topBar = document.createElement('div');
  topBar.className = 'holo-top-bar';
  topBar.innerHTML = `
    <div class="holo-brand-badge">
      <span class="holo-status-dot"></span>
      XEROHOLOGRAM
    </div>
    <button id="btn-toggle-mic" class="holo-btn holo-btn-cyan">🎙 MIC STREAM</button>
    <button id="btn-open-rig-studio" class="holo-btn holo-btn-secondary">📦 3D AVATAR & RIG</button>
    <button id="btn-toggle-terminal" class="holo-btn holo-btn-secondary">💻 WRIST HUD</button>
    <button id="btn-spawn-clone" class="holo-btn holo-btn-secondary">✨ SPAWN AGENT</button>
    <button id="btn-open-calib" class="holo-btn holo-btn-secondary">📐 STAGE CALIB</button>
  `;
  document.body.appendChild(topBar);

  let isMicActive = false;
  const btnMic = topBar.querySelector('#btn-toggle-mic') as HTMLButtonElement;
  btnMic.addEventListener('click', async () => {
    isMicActive = !isMicActive;
    if (isMicActive) {
      await speechSensor.start();
      btnMic.textContent = '🎙 MIC: ACTIVE';
      btnMic.classList.add('holo-btn-active');
      floatingWidgets.log('[MIC] Continuous SpeechRecognition & VAD started.');
    } else {
      speechSensor.stop();
      btnMic.textContent = '🎙 MIC STREAM';
      btnMic.classList.remove('holo-btn-active');
      floatingWidgets.log('[MIC] Speech capture paused.');
    }
  });

  const btnTerminal = topBar.querySelector('#btn-toggle-terminal') as HTMLButtonElement;
  btnTerminal.addEventListener('click', () => {
    const isVis = !floatingWidgets.isTerminalVisible();
    floatingWidgets.setTerminalVisible(isVis);
    btnTerminal.classList.toggle('holo-btn-active', isVis);
    if (isVis) {
      currentBasePose = 'terminal_summon';
    } else {
      currentBasePose = 'neutral';
    }
  });

  const btnSpawn = topBar.querySelector('#btn-spawn-clone') as HTMLButtonElement;
  btnSpawn.addEventListener('click', () => {
    const subId = `agent-${Date.now().toString().slice(-4)}`;
    floatingWidgets.spawnSubAgent(subId, 'Synthesizer-Worker');
    setTimeout(() => floatingWidgets.dismissSubAgent(subId), 5000);
  });

  const btnRig = topBar.querySelector('#btn-open-rig-studio');
  btnRig?.addEventListener('click', () => rigDrawer.toggle());

  const btnCalib = topBar.querySelector('#btn-open-calib');
  btnCalib?.addEventListener('click', () => calibPanel.toggle());

  // 14. 60 FPS Main Render & Physics Hook
  stage.registerRenderHook((delta, elapsed) => {
    const now = performance.now();
    telemetryHUD.tick(delta * 1000);
    particles.update(delta, elapsed);

    // A. Evaluate Gesture Queue Sequence
    if (gestureKeyframeQueue.length > 0) {
      const elapsedGestureMs = now - gestureStartTime;
      let activeIndex = -1;

      for (let i = 0; i < gestureKeyframeQueue.length; i++) {
        const kf = gestureKeyframeQueue[i];
        if (elapsedGestureMs >= kf.triggerMs && elapsedGestureMs < kf.triggerMs + kf.durationMs) {
          activeIndex = i;
          currentBasePose = kf.preset;
          currentOverrides = kf.overrides;
          currentBlendWeight = kf.weight;
          break;
        }
      }

      if (activeIndex === -1 && elapsedGestureMs >= gestureKeyframeQueue[gestureKeyframeQueue.length - 1].triggerMs + gestureKeyframeQueue[gestureKeyframeQueue.length - 1].durationMs) {
        gestureKeyframeQueue = [];
        currentBasePose = 'neutral';
        currentOverrides = {};
        currentBlendWeight = 1.0;
      }
    }

    // B. Blend Targets (Base Preset + D3 Overrides)
    const blendedTargets = PoseBlender.blendPose(currentBasePose, currentOverrides, currentBlendWeight);
    for (const [joint, anglesDeg] of blendedTargets.entries()) {
      springSolver.setTargetDeg(joint, anglesDeg);
    }

    // C. Step 60Hz SO(3) Spring Solver
    springSolver.step(delta);

    // D. Biological Idle Life (Breathing, Saccades, Blinks)
    const idleOffsets = idleLife.update(elapsed, delta);

    // E. Real-time Audio Frequency FFT & Viseme Analysis
    const freqData = audioPlayer.getFrequencyData();
    const viseme = visemeAnalyzer.analyze(freqData, delta);
    telemetryHUD.updateData({ visemeEnergy: viseme.rmsEnergy });

    // F. Reactor Core Voice Pulse & Visor Glow (if default rig)
    if (!isCustomLoaded) {
      proceduralRig.updateReactorPulse(viseme.rmsEnergy, delta);
    }

    // G. Apply Rotations to Active Skeleton Bones
    for (const [joint, bone] of activeBones.entries()) {
      const springRad = springSolver.getCurrentEulerRad(joint);
      const idleAdd = idleOffsets.jointOffsets.get(joint) || [0, 0, 0];

      // Convert idle deg to rad
      const idleRadX = (idleAdd[0] * Math.PI) / 180.0;
      const idleRadY = (idleAdd[1] * Math.PI) / 180.0;
      const idleRadZ = (idleAdd[2] * Math.PI) / 180.0;

      // Add prosodic beat coupling to forearm and neck
      let beatPitch = 0;
      if (joint === Joint28.lower_arm_R || joint === Joint28.lower_arm_L) {
        beatPitch = viseme.forearmBeatOffsetRad;
      } else if (joint === Joint28.neck) {
        beatPitch = viseme.neckBeatOffsetRad;
      }

      // Apply to bone local rotation
      bone.rotation.set(
        springRad.x + idleRadX + beatPitch,
        springRad.y + idleRadY,
        springRad.z + idleRadZ
      );
    }

    // H. Articulate Jaw Bone for Lip-Sync
    if (activeJawBone) {
      activeJawBone.rotation.x = viseme.jawPitchRad;
    }

    // I. Update Floating Widgets (Wrist Terminal Attachment & Sub-Agent Animations)
    const leftHandBone = activeBones.get(Joint28.hand_L);
    floatingWidgets.updateWristAttachment(leftHandBone || null);
    floatingWidgets.update(now);
  });

  // Start Holographic Stage
  stage.start();
  floatingWidgets.log('[READY] XeroHoloGram 60FPS Stage Initialized.');
}

window.addEventListener('DOMContentLoaded', bootstrapHologramApp);
