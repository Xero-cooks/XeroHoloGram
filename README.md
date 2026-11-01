# XeroHoloGram

<p align="center">
  <strong>Ultra-Low-Latency 3D Holographic AI Agent Harness & Universal Rigged-Character Engine</strong><br>
  <em>Engineered for physical Pepper's Ghost optical stages (180° flat base screen + 45° Pythagorean beam splitter) and standard 3D web viewports.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-WebGL2_60FPS-00e5ff" alt="Three.js" />
  <img src="https://img.shields.io/badge/FastAPI-uvloop_Daemon-009688" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Kinematics-SO(3)_Spring_Damper-ff007f" alt="Kinematics" />
  <img src="https://img.shields.io/badge/Latency-<250ms_Barge--In-7928ca" alt="Latency" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License" />
</p>

---

## 1. System Architecture

```text
+--------------------------------------------------------------------------------------------------+
|                        FRONTEND: THREE.JS + WEBGL HOLOGRAM ENGINE (60 FPS)                       |
|                                                                                                  |
|  +------------------------+   +------------------------------+   +----------------------------+  |
|  | Web Speech API + VAD   |   | Universal Rig Loader &       |   | Pepper's Ghost Optical     |  |
|  | (Mic Sensor -> Interim |   | Auto-Bone Mapper Studio      |   | Stage Calibration Engine   |  |
|  |  & Final STT Stream)   |   | (.glb/.vrm -> 55-Bone Map)   |   | (ScaleX/Y Flip, Pythagoras |  |
|  +-----------+------------+   +--------------+---------------+   |  FOV, Fresnel Rim Shader)  |  |
|              |                               |                   +--------------+-------------+  |
|              v                               v                                  ^                |
|  +------------------------+   +------------------------------+                  |                |
|  | Full-Duplex Binary/JSON|   | 60Hz Critically Damped       |------------------+                |
|  | WebSocket Client       |==>| SO(3) Spring-Damper Solver   |                                   |
|  | (Barge-In Interrupts)  |   | + FFT Viseme Lip-Sync Engine |                                   |
|  +-----------+------------+   +------------------------------+                                   |
+--------------|-----------------------------------------------------------------------------------+
               |  ws://localhost:8765/ws/hologram (Full-Duplex Multiplexed Stream)
               v
+--------------------------------------------------------------------------------------------------+
|                     BACKEND: ULTRAFAST ASYNC MULTIPLEXER DAEMON (FastAPI / uvloop)               |
|                                                                                                  |
|                       +----------------------------------------------+                           |
|                       |    Turn & Barge-In State Machine Router      |                           |
|                       |  (Triggers Speculative Pre-Warm on Interim)  |                           |
|                       +---------+--------------------------+---------+                           |
|                                 |                          |                                     |
|          [PARALLEL STREAM A: VOICE & ACOUSTICS]     [PARALLEL STREAM B: D3 KINEMATICS]           |
|                                 v                          v                                     |
|  +----------------------------------------+      +--------------------------------------------+  |
|  | LLM Conversational Core + Clause       |      | D3 Kinematic Decision Engine (Fast LLM)    |  |
|  | Chunker -> Streaming TTS Engine        |      | Outputs Structured JSON Gesture Timeline,  |  |
|  | (Kokoro-82M / Edge-TTS / ElevenLabs)   |      | Bone Angle Overrides (alpha, beta, gamma), |  |
|  | Streams 24kHz PCM + Word Timestamps    |      | Gaze Vectors, & Hologram FX States         |  |
|  +----------------------------------------+      +--------------------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Core Capabilities

### 2.1 Pepper's Ghost Physical Optics & Calibration
- **Householder Reflection Solver**: Exact $\mathbf{R}_{\Pi} = \mathbf{I} - 2\mathbf{n}\mathbf{n}^T$ matrix reflection mapping horizontal display depth to eye-level vertical elevation.
- **Dynamic Optical Inversion**: Horizontal ($S_x = \pm 1$) and vertical ($S_y = \pm 1$) flip transforms with backface winding parity correction.
- **Pythagorean FOV Compensation**: Solves $\tan(\text{FOV}_y'/2) = \tan(\text{FOV}_y/2) / \cos(\theta_{\text{glass}})$ to eliminate vertical aspect foreshortening.
- **Holographic Shader Suite**: Custom Fresnel rim glow ($I_{\text{rim}} = (1 - \mathbf{N}\cdot\mathbf{V})^{p}$), interlaced CRT scanlines, and radial chromatic dispersion. Pure black `rgb(0,0,0)` pixels are treated as optically transparent.

### 2.2 Universal Rig Engine & Visual Bone Studio
- **Canonical 55-Bone Skeleton**: Full humanoid hierarchy including cervical spine chain (`Hips`, `Spine`, `Chest`, `UpperChest`, `Neck`, `Head`, `Eyes`, `Jaw`), arms, legs, and 30 hand finger phalanges.
- **Automated Heuristic Mappers**: Out-of-the-box regex auto-detection for **Mixamo**, **VRoid Studio (VRM 0.x / 1.0)**, **Unreal Engine Manny/Quinn**, and **Blender Rigify**.
- **Interactive 3D Bone Studio**: Color-coded bone joint markers (Green $\ge 90\%$, Yellow $50-89\%$, Red $< 50\%$) with raycasting click-to-map and bind-pose A-to-T pose normalization.

### 2.3 60Hz SO(3) Biomechanical Kinematics
- **Critically Damped Quaternion Spring-Damper**: Damping ratio $\zeta = 1.0$ and natural frequency $\omega_n = 18 - 24\text{ rad/s}$ for smooth, natural human movement without gimbal lock or robotic overshoot.
- **Cervical Gaze Solver**: Anatomically distributed gaze across Eyes (15%), Head (35%), Neck (25%), Chest (15%), and Spine (10%) clamped within joint mobility safety cones.
- **Poisson Eye Saccades & Diaphragmatic Breathing**: Dual-harmonic parametric breathing and micro-saccadic eye jitter ($\lambda = 2.2\text{s}$) with physiological ocular tremor.

### 2.4 Dual-Mode Viseme Lip-Sync Synthesizer
- **Mode 1 (Real-Time Audio FFT)**: Formant energy binning into $F_1$ ($150-800\text{Hz}$), $F_2$ ($800-2200\text{Hz}$), and $F_3$ ($2200-4500\text{Hz}$) with asymmetric attack ($\tau = 10\text{ms}$) and decay ($\tau = 45\text{ms}$) driving 15 Preston Blair / Oculus visemes.
- **Mode 2 (Phoneme Timestamps)**: Hermite spline interpolation over TTS word timestamps.
- **Hybrid Crossfade & Jaw Fallback**: Automatic crossfade between modes with physical jaw pitch rotation fallback if the avatar model lacks facial blendshapes.

### 2.5 Cybernetic Floating Augmentations & Sub-Agent Spawner
- **Left-Wrist Holographic Terminal**: Real-time stdout text quad attached to character's `hand_L` joint displaying live agent logs, code execution stdout, and WebSocket telemetry with glowing borders and additive blending.
- **Sub-Agent Holographic Spawner**: Mini 3D holographic wireframe clone or geometric orb that materializes beside the main hologram when background tools or sub-agents are invoked, pulsating with orbital particle rings and dissolving upon completion.

### 2.6 Ultrafast Async Daemon & Sub-50ms Barge-In
- **FastAPI + uvloop**: Full-duplex WebSocket at `/ws/hologram` multiplexing binary PCM audio frames (with 16-byte headers) and JSON control packets.
- **Instant Barge-In**: Client-side VAD interrupts avatar speech in $< 20\text{ms}$, purges audio jitter buffers, zeroes spring velocities, and cancels server-side generation tasks.
- **Universal TTS Adapters**: Support for **Edge-TTS**, **Kokoro-82M**, **ElevenLabs**, **Cartesia Sonic**, **OpenAI TTS-1**, and local **Piper**.

---

## 3. Quickstart

### Prerequisites
- [Bun](https://bun.sh) (v1.1+) or Node.js (v20+)
- Python 3.10+

### One-Command Startup

```bash
# Windows
start_holo.bat

# Linux / macOS
chmod +x start_holo.sh
./start_holo.sh
```

### Manual Installation & Testing

```bash
# 1. Install frontend dependencies and run unit tests
bun install --cwd frontend
bun test frontend/tests

# 2. Build production frontend bundle
cd frontend && bun run build && cd ..

# 3. Install backend dependencies and run pytest suite
pip install -r backend/requirements.txt
pytest backend/tests
```

Open your browser at `http://localhost:5173` to interact with the 3D Holographic Stage.
