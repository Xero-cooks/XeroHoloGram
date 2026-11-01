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
import { HoloSocketClient, D3KinematicPacket, AgenticDecisionPacket, ToolActionCall } from './network/HoloSocketClient';
import { FloatingWidgets } from './shaders/FloatingWidgets';
import { RigStudioDrawer } from './ui/RigStudioDrawer';
import { StageCalibPanel, StageCalibSettings } from './ui/StageCalibPanel';
import { TelemetryHUD } from './ui/TelemetryHUD';
import { AICoreModal, LLMConfig, TTSConfig } from './ui/AICoreModal';
import { AudioSettingsDrawer, AudioSettingsData } from './ui/AudioSettingsDrawer';
import { LoadedRiggedModel } from './rig/UniversalModelLoader';
import { ICONS } from './ui/HoloIcons';

/**
 * XeroHoloGram Main Application Bootstrapper
 * Orchestrates 60 FPS WebGL Hologram Viewport, SO(3) Kinematics,
 * Multi-Format 3D Model Ingestion, AI Core (LLM/TTS) Harness,
 * Microphone Device Selector, and Fullscreen Pepper's Ghost Projection.
 */
async function bootstrapHologramApp() {
  const container = document.getElementById('hologram-viewport');
  if (!container) return;

  // 1. Initialize Stage & Holographic Camera
  const stage = new HologramStage(container, DEFAULT_STAGE_CONFIG);
  // Default IPS Panel Display High-Contrast Boost
  stage.setIPSOptimization(true, 1.45);

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
      aiModal.log(`[STT INTERIM] "${interimText}"`);
    },
    onFinalTranscript: (finalText: string) => {
      telemetryHUD.updateData({ speechState: 'SPEAKING' });
      wsClient.sendTranscript(finalText, true);
      floatingWidgets.log(`[STT FINAL] "${finalText}"`);
      aiModal.log(`[YOU]: "${finalText}"`);
    }
  });

  // 10. AI Core Modal (LLM & TTS Settings & Test Harness)
  const aiModal = new AICoreModal({
    onSaveLLMConfig: (llmCfg: LLMConfig) => {
      wsClient.sendJSON({
        type: 'llm_config',
        provider: llmCfg.provider,
        base_url: llmCfg.baseUrl,
        api_key: llmCfg.apiKey,
        model: llmCfg.model,
        system_prompt: llmCfg.systemPrompt
      });
      floatingWidgets.log(`[AI SYNC] LLM: ${llmCfg.model}`);
    },
    onSaveTTSConfig: (ttsCfg: TTSConfig) => {
      wsClient.sendJSON({
        type: 'llm_config',
        tts_engine: ttsCfg.engine,
        tts_voice: ttsCfg.voice,
        tts_rate: ttsCfg.rate
      });
      floatingWidgets.log(`[TTS SYNC] Voice: ${ttsCfg.voice}`);
    },
    onSendTestPrompt: (promptText: string) => {
      floatingWidgets.log(`[PROMPT] "${promptText}"`);
      telemetryHUD.updateData({ speechState: 'SPEAKING' });

      // Send to WebSocket backend
      wsClient.sendJSON({
        type: 'prompt_request',
        text: promptText,
        client_timestamp: performance.now()
      });

      // Browser TTS Fallback if user selected browser_tts or backend is offline
      const currentTTS = aiModal.getTTSConfig();
      if (currentTTS.engine === 'browser_tts' || typeof window.speechSynthesis !== 'undefined') {
        const u = new SpeechSynthesisUtterance(promptText);
        u.pitch = 0.9;
        u.rate = 1.05;
        // Trigger responsive gesture
        currentBasePose = 'hand_up_ack';
        setTimeout(() => { currentBasePose = 'finger_up_insight'; }, 1200);
        setTimeout(() => { currentBasePose = 'neutral'; }, 3200);
      }
    },
    onTestVoiceSample: (sampleText: string, voiceName: string) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(sampleText);
        u.pitch = 0.92;
        u.rate = 1.0;
        window.speechSynthesis.speak(u);
      }
      currentBasePose = 'hand_up_ack';
      setTimeout(() => { currentBasePose = 'neutral'; }, 2500);
    }
  });

  // 11. Audio & Microphone Settings Drawer
  const audioDrawer = new AudioSettingsDrawer({
    onRequestPermission: async () => {
      try {
        await speechSensor.start();
        btnMic.innerHTML = `${ICONS.mic} MIC: ACTIVE`;
        btnMic.classList.add('holo-btn-active');
        floatingWidgets.log('[MIC] Microphone granted & listening.');
        return true;
      } catch (e) {
        floatingWidgets.log('[MIC ERR] Access denied.');
        return false;
      }
    },
    onDeviceSelect: (deviceId: string) => {
      floatingWidgets.log(`[MIC] Selected device: ${deviceId}`);
    },
    onSettingsChange: (settings: AudioSettingsData) => {
      floatingWidgets.log(`[MIC DSP] VAD Thresh: ${settings.energyThreshold}, Lang: ${settings.language}`);
    }
  });

  // 12. Multi-Format Rig Studio & Model Configuration Drawer
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
      stage.scene.remove(activeModelRoot);
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

  // 13. Optical Stage Calibrator
  let isProjectionMode = false;
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
      document.body.classList.toggle('holo-mirror-horizontal', settings.flipX);
      floatingWidgets.log(`[CALIB] Reflector: ${settings.glassAngleDeg}°, FOV: ${settings.compensatedFovDeg}°`);
    },
    onFullscreenToggle: () => {
      toggleFullscreenProjection();
    },
    onIPSOptimizationChange: (enabled: boolean, exposure: number) => {
      stage.setIPSOptimization(enabled, exposure);
      floatingWidgets.log(`[IPS BOOST] ${enabled ? 'ACTIVE' : 'OFF'} (Exposure: ${exposure.toFixed(2)}x)`);
    }
  });

  // 14. Fullscreen Pepper's Ghost Projection Mode Handlers
  const toggleFullscreenProjection = async (force?: boolean) => {
    const isFs = await stage.toggleFullscreen(force);
    isProjectionMode = isFs;
    document.body.classList.toggle('holo-projection-mode', isFs);

    const toast = document.getElementById('holo-projection-toast');
    if (toast && isFs) {
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }
  };

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      isProjectionMode = false;
      document.body.classList.remove('holo-projection-mode');
    }
  });

  // Double click canvas to toggle Fullscreen
  container.addEventListener('dblclick', () => {
    toggleFullscreenProjection();
  });

  // Create Toast & Floating Exit Button
  const exitBtn = document.createElement('button');
  exitBtn.id = 'btn-exit-projection';
  exitBtn.textContent = '✕ EXIT FULLSCREEN';
  exitBtn.addEventListener('click', () => toggleFullscreenProjection(false));
  document.body.appendChild(exitBtn);

  const toastEl = document.createElement('div');
  toastEl.id = 'holo-projection-toast';
  toastEl.textContent = '⛶ FULLSCREEN OPTICAL MODE ACTIVE — Double-click screen or press ESC to exit';
  document.body.appendChild(toastEl);

  // 15. Wire WebSocket Handlers
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
    aiModal.log(`[D3 GESTURE]: ${packet.intent_class} (${packet.emotion})`);

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

  // Handle Structured Decision LLM Packets
  wsClient.onDecision((decision: AgenticDecisionPacket) => {
    aiModal.renderDecisionCard(decision);
    aiModal.log(`[DECISION ${decision.intent_class.toUpperCase()}]: "${decision.speech_response}"`);
    floatingWidgets.log(`[POLICY DECISION] ${decision.intent_class} (${Math.round(decision.confidence * 100)}% conf)`);

    telemetryHUD.updateData({
      intentClass: decision.intent_class,
      emotion: decision.emotion,
      shaderState: decision.holo_shader_state,
      d3LatencyMs: Math.round(decision.gesture_sequence.length ? 115 : 65)
    });

    // Update Fresnel Shader Palette according to decision state
    const shaderColorMap: Record<string, number> = {
      cyan_nominative: 0x00f0ff,
      magenta_glitch: 0xff0055,
      emerald_healed: 0x00ff9d,
      amber_warning: 0xffaa00,
      deep_blue_focus: 0x0088ff
    };
    if (decision.holo_shader_state in shaderColorMap) {
      proceduralRig.setShaderColor?.(shaderColorMap[decision.holo_shader_state]);
    }
  });

  // Handle Tool Action Triggers
  wsClient.onToolAction((tool: ToolActionCall) => {
    floatingWidgets.log(`[TOOL TRIGGER] ${tool.name}`);

    if (tool.name === 'summon_wrist_terminal') {
      floatingWidgets.setTerminalVisible(true);
    } else if (tool.name === 'spawn_subagent') {
      const subId = tool.parameters?.worker_id || `worker-${Math.floor(Math.random() * 900 + 100)}`;
      floatingWidgets.spawnSubAgent(subId, 'Task Coordinator');
      setTimeout(() => floatingWidgets.dismissSubAgent(subId), 5000);
    } else if (tool.name === 'execute_quantum_heal') {
      particles.setIntensity(0.7);
      setTimeout(() => particles.setIntensity(0.38), 2000);
      floatingWidgets.log('[QUANTUM HEAL] Restoring canonical SO(3) rest pose.');
    }
  });

  wsClient.connect();

  // 16. Floating Command Bar (Top Navigation)
  const topBar = document.createElement('div');
  topBar.className = 'holo-top-bar';
  topBar.innerHTML = `
    <div class="holo-brand-badge">
      <span class="holo-status-dot"></span>
      XEROHOLOGRAM
    </div>
    <button id="btn-toggle-mic" class="holo-btn holo-btn-cyan">${ICONS.mic} MIC STREAM</button>
    <button id="btn-open-mic-settings" class="holo-btn holo-btn-secondary">${ICONS.sliders} MIC DSP</button>
    <button id="btn-open-ai-core" class="holo-btn holo-btn-secondary">${ICONS.cpu} AI CORE</button>
    <button id="btn-open-rig-studio" class="holo-btn holo-btn-secondary">${ICONS.box} 3D AVATAR & RIG</button>
    <button id="btn-fullscreen-proj" class="holo-btn holo-btn-cyan">${ICONS.maximize} PROJECTION</button>
    <button id="btn-toggle-terminal" class="holo-btn holo-btn-secondary">${ICONS.terminal} WRIST HUD</button>
    <button id="btn-spawn-clone" class="holo-btn holo-btn-secondary">${ICONS.box} SPAWN AGENT</button>
    <button id="btn-open-calib" class="holo-btn holo-btn-secondary">${ICONS.layers} STAGE CALIB</button>
  `;
  document.body.appendChild(topBar);

  let isMicActive = false;
  const btnMic = topBar.querySelector('#btn-toggle-mic') as HTMLButtonElement;
  btnMic.addEventListener('click', async () => {
    isMicActive = !isMicActive;
    if (isMicActive) {
      await speechSensor.start();
      btnMic.innerHTML = `${ICONS.mic} MIC: ACTIVE`;
      btnMic.classList.add('holo-btn-active');
      floatingWidgets.log('[MIC] Continuous SpeechRecognition & VAD started.');
    } else {
      speechSensor.stop();
      btnMic.innerHTML = `${ICONS.mic} MIC STREAM`;
      btnMic.classList.remove('holo-btn-active');
      floatingWidgets.log('[MIC] Speech capture paused.');
    }
  });

  const btnMicSettings = topBar.querySelector('#btn-open-mic-settings');
  btnMicSettings?.addEventListener('click', () => audioDrawer.toggle());

  const btnAICore = topBar.querySelector('#btn-open-ai-core');
  btnAICore?.addEventListener('click', () => aiModal.toggle());

  const btnRig = topBar.querySelector('#btn-open-rig-studio');
  btnRig?.addEventListener('click', () => rigDrawer.toggle());

  const btnFullscreen = topBar.querySelector('#btn-fullscreen-proj');
  btnFullscreen?.addEventListener('click', () => toggleFullscreenProjection());

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

  const btnCalib = topBar.querySelector('#btn-open-calib');
  btnCalib?.addEventListener('click', () => calibPanel.toggle());

  // 17. 60 FPS Main Render & Physics Hook
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
    audioDrawer.updateVUMeter(viseme.rmsEnergy);

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
