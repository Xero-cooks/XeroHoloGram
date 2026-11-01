import * as THREE from 'three';
import { DEFAULT_STAGE_CONFIG } from './config/stageConfig';
import { HologramStage } from './renderer/HologramStage';
import { HoloParticles } from './renderer/HoloParticles';
import { StageCalibrationController } from './optics/CalibrationController';
import { DefaultAvatarGenerator } from './rig/DefaultAvatarGenerator';
import { BoneRetargeter } from './rig/BoneRetargeter';
import { VisualBoneStudio } from './studio/BoneStudio';
import { MotionBlendEngine } from './kinematics/MotionBlendEngine';
import { WebAudioManager } from './audio/WebAudioManager';
import { MicCaptureStream } from './audio/MicCaptureStream';
import { ClientVAD } from './audio/ClientVAD';
import { AudioJitterBuffer } from './audio/AudioJitterBuffer';
import { FFTFormantAnalyzer } from './audio/FFTFormantAnalyzer';
import { HybridLipSyncEngine } from './audio/HybridLipSyncEngine';
import { MorphBlendshapeDriver } from './audio/MorphBlendshapeDriver';
import { VisemeName } from './audio/visemeTypes';
import { HologramWSClient } from './ws/HologramWSClient';
import { BargeInCoordinator } from './ws/BargeInCoordinator';
import { OrchestratorHUD } from './ui/OrchestratorHUD';
import { OpticalControls } from './ui/OpticalControls';
import { ModelPickerDrawer } from './ui/ModelPickerDrawer';
import { AudioSettingsPanel } from './ui/AudioSettingsPanel';
import { DiagnosticHUD } from './ui/DiagnosticHUD';

async function bootstrapHologramApp() {
  const container = document.getElementById('hologram-viewport');
  if (!container) return;

  // 1. Stage Calibration & WebGL Viewport
  const calibrationController = new StageCalibrationController(DEFAULT_STAGE_CONFIG.optical);
  const stage = new HologramStage(container, DEFAULT_STAGE_CONFIG);

  // Synchronize calibration changes with stage camera projection
  calibrationController.subscribe(opticalConfig => {
    stage.updateConfig({ ...DEFAULT_STAGE_CONFIG, optical: opticalConfig });
  });

  // 2. Ambient Holographic Dust Field
  const particles = new HoloParticles(200);
  stage.scene.add(particles.points);

  // 3. Default Humanoid Rigged Avatar
  const { model: currentModel, mappingTable } = DefaultAvatarGenerator.createDefaultAvatar();
  stage.scene.add(currentModel.root);

  const retargeter = new BoneRetargeter(currentModel.bones, mappingTable);
  const blendshapeDriver = new MorphBlendshapeDriver(currentModel.skinnedMeshes, currentModel.bones.get('Jaw'));

  // 4. Interactive 3D Visual Bone Studio Overlay
  const boneStudio = new VisualBoneStudio();
  boneStudio.buildMarkers(currentModel.bones, mappingTable);
  boneStudio.setVisible(false);
  stage.scene.add(boneStudio.group);

  // 5. 60Hz SO(3) Kinematics & Physics Engine
  const motionEngine = new MotionBlendEngine();

  // 6. Audio Pipeline & Lip-Sync
  const audioManager = new WebAudioManager();
  const micCapture = new MicCaptureStream();
  const jitterBuffer = new AudioJitterBuffer(24000, 60);
  const fftAnalyzer = new FFTFormantAnalyzer(24000, 512);
  const lipSyncEngine = new HybridLipSyncEngine();

  // 7. Full-Duplex WebSocket Client & Barge-In Coordinator
  const wsClient = new HologramWSClient(DEFAULT_STAGE_CONFIG.wsEndpoint);
  const bargeInCoordinator = new BargeInCoordinator(
    wsClient,
    jitterBuffer,
    audioManager,
    motionEngine,
    'sess_demo'
  );

  // 8. Client-side VAD
  const vad = new ClientVAD(
    { energyThreshold: 0.03, speechHangoverMs: 250, minSpeechDurationMs: 70 },
    {
      onSpeechStart: () => {
        bargeInCoordinator.triggerBargeIn();
      },
      onSpeechEnd: () => {
        // Speech ended, ready for LLM
      }
    }
  );

  // Connect WebSocket binary & JSON handlers
  wsClient.onAudio((header, pcmSamples) => {
    jitterBuffer.pushChunk(pcmSamples);
  });

  wsClient.onMessage((msg: any) => {
    if (msg.type === 'kinematic_frame') {
      const gestureMap = new Map<any, THREE.Quaternion>();
      for (const g of msg.gestures || []) {
        const euler = new THREE.Euler(g.rotation_euler[0], g.rotation_euler[1], g.rotation_euler[2], 'YXZ');
        gestureMap.set(g.bone, new THREE.Quaternion().setFromEuler(euler));
      }
      motionEngine.setGesture(gestureMap);
      if (msg.gaze?.target) {
        motionEngine.setGazeTarget(new THREE.Vector3(msg.gaze.target[0], msg.gaze.target[1], msg.gaze.target[2]));
      }
    }
  });

  wsClient.connect();

  // 9. UI Orchestrator HUD
  const hud = new OrchestratorHUD(container);
  const mount = hud.getMountPoint();

  new OpticalControls(mount, calibrationController);
  const modelDrawer = new ModelPickerDrawer(mount, {
    onToggleBoneStudio: (active) => boneStudio.setVisible(active),
  });
  const audioPanel = new AudioSettingsPanel(mount, {
    onMuteToggle: (muted) => micCapture.setMute(muted),
  });
  const diagHUD = new DiagnosticHUD(mount);

  // 10. Start Microphone stream on user interaction
  window.addEventListener('click', async () => {
    try {
      await audioManager.getAudioContext();
      await micCapture.start();
    } catch {
      // Audio autoplay policy
    }
  }, { once: true });

  // 11. Main 60 FPS Holographic Animation Loop
  stage.registerRenderHook((delta, elapsed) => {
    diagHUD.recordFrame();
    particles.update(delta, elapsed);

    // Evaluate Kinematics
    const headWorldPos = new THREE.Vector3();
    const headBone = currentModel.bones.get('Head');
    if (headBone) headBone.getWorldPosition(headWorldPos);

    const boneRotations = motionEngine.update(elapsed, delta, headWorldPos, currentModel.root.quaternion);

    // Apply to 55-bone skeleton via retargeter
    for (const [canonical, rot] of boneRotations.entries()) {
      retargeter.applyBoneRotation(canonical, rot);
    }

    // Process mic audio and VAD
    const micRms = micCapture.getVolumeRms();
    audioPanel.updateVUMeter(micRms);

    // Real-time audio playback & viseme synthesis
    const analyser = audioManager.getAnalyser();
    if (analyser) {
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);
      const formants = fftAnalyzer.analyzeFrequencies(freqData);

      const visemeWeights = lipSyncEngine.evaluate(formants, elapsed * 1000.0, delta);
      blendshapeDriver.applyVisemes(visemeWeights);

      // Find top active viseme for diagnostic hud
      let topViseme = 'sil';
      let maxWeight = 0;
      for (const [vis, w] of Object.entries(visemeWeights)) {
        if (vis !== VisemeName.sil && w > maxWeight) {
          maxWeight = w;
          topViseme = vis;
        }
      }
      diagHUD.updateViseme(topViseme);
    }

    diagHUD.updateBuffer(jitterBuffer.getBufferedDurationMs());
  });

  // Start rendering
  stage.start();
}

window.addEventListener('DOMContentLoaded', bootstrapHologramApp);
