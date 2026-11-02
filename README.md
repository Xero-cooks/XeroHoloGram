# Agentic-Hologram (XeroHoloGram)

<p align="center">
  <strong>Universal Open-Source 3D Holographic AI Agent Harness & Physical Pepper's Ghost Optical Stage Engine</strong><br>
  <em>Turn any laptop, tablet, or monitor into a conversational physical 3D hologram with sub-250ms dual-stream voice & D3 kinematic body language.</em>
</p>

<p align="center">
  <a href="#-quickstart"><img src="https://img.shields.io/badge/Three.js-WebGL2_60FPS-00e5ff?style=flat-square" alt="Three.js" /></a>
  <a href="#-sub-250ms-dual-stream-multiplexer-daemon"><img src="https://img.shields.io/badge/FastAPI-uvloop_Daemon-009688?style=flat-square" alt="FastAPI" /></a>
  <a href="#-60hz-so3-biomechanical-kinematics--spring-physics"><img src="https://img.shields.io/badge/Kinematics-SO(3)_Spring_Damper-ff007f?style=flat-square" alt="Kinematics" /></a>
  <a href="#-zero-latency-web-speech-to-text--sub-30ms-barge-in"><img src="https://img.shields.io/badge/Latency-<30ms_Barge--In-7928ca?style=flat-square" alt="Latency" /></a>
  <a href="#-interactive-3d-dock-blueprint--setup-visualizer"><img src="https://img.shields.io/badge/Setup-Cardboard_One--Piece_Dock-00ff9d?style=flat-square" alt="Dock" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square" alt="License" /></a>
</p>

---

## Table of Contents
1. [Overview & Highlights](#-overview--highlights)
2. [Interactive 3D Dock Blueprint & Setup Visualizer](#-interactive-3d-dock-blueprint--setup-visualizer)
3. [Physical Hardware Assembly Guide (The 10-Minute Removable Dock)](#-physical-hardware-assembly-guide-the-10-minute-removable-dock)
4. [Laptop Compatibility: 180° Flat Hinge vs. Standard Laptops](#-laptop-compatibility-180-flat-hinge-vs-standard-laptops)
5. [Display Resolutions & Device Compatibility Notice](#-display-resolutions--device-compatibility-notice)
6. [System Architecture](#-system-architecture)
7. [Core Subsystems & Technical Specifications](#-core-subsystems--technical-specifications)
8. [Quickstart & Installation](#-quickstart--installation)
9. [D3 Kinematic Gesture Library](#-d3-kinematic-gesture-library)
10. [Roadmap & Community](#-roadmap--community)
11. [License](#-license)

---

## ◈ Overview & Highlights

**Agentic-Hologram** is an open-source framework designed to bring autonomous AI agents into the physical world without requiring expensive AR glasses, proprietary holographic displays, or VR headsets. Using classical **Pepper's Ghost arcade-hood optics** ($180^\circ$ flat base screen + $45^\circ$ beam splitter) paired with modern **WebGL shaders**, **60Hz critically damped spring physics**, and a **parallel dual-stream backend**, it projects an upright, full-depth 3D AI agent that talks, listens, interrupts, gestures, and manipulates virtual tools in real time.

- **Zero-Cost Out-of-the-Box**: Works immediately with the built-in procedural rigged sci-fi avatar (**XeroKratos**) featuring an articulated lip-sync jaw, glowing visor, and voice-reactive rotating reactor core.
- **Universal Rig Importer**: Drag-and-drop any custom `.glb`, `.gltf`, or `.vrm` character model into the browser and auto-map its skeleton to the Canonical 28-Joint Humanoid Hierarchy in seconds.
- **Physical Optical Transparency**: Pure `#000000` screen pixels become completely transparent in the physical reflector, creating a floating 3D entity standing upright inside a dark optical cave.
- **Dual-Stream Latency Under 250ms**: Parallel non-blocking execution of Speech/TTS (Stream A) and D3 Kinematic Reasoning (Stream B) over a single multiplexed full-duplex WebSocket.
- **Barge-In Reflex (<30ms)**: Instant audio buffer flushing and attentive conversational posture transition when you speak while the hologram is talking.
- **Floating Cybernetic Widgets**: Wrist-mounted live scrolling terminal showing background agent logs and dynamic 3D sub-agent wireframe orb spawning.

---

## ◈ Interactive 3D Dock Blueprint & Setup Visualizer

This repository includes a standalone, zero-installation interactive 3D Dock Builder: **[`dock_blueprint.html`](dock_blueprint.html)**.

You can double-click **`dock_blueprint.html`** in your file explorer to open it in any web browser with zero server setup!

```text
+-----------------------------------------------------------------------------------------+
|                      XEROKRATOS // ONE-PIECE DOCK BUILDER & LIVE RIG                    |
|                                                                                         |
|  [EXPLODE / ASSEMBLE SLIDER]:  0% [Glued & Placed] <===========> 100% [Exploded Cuts]   |
|                                                                                         |
|  Mode [1]: 3D BOX ASSEMBLY & SETUP VISUALIZER                                           |
|            -> Interactive 3D orbital camera showing how 4 cardboard pieces + 1 clear    |
|               sheet assemble and drop right onto your 180° flat laptop screen.          |
|                                                                                         |
|  Mode [2]: LIVE HOLOGRAM PROJECTION                                                     |
|            -> Applies scaleX(-1) mirror correction and pure black #000000 backdrop.     |
|               Drop your assembled box on the screen and turn room lights OFF!           |
|                                                                                         |
|  Live Kinematic Testing:                                                                |
|  [Neutral Idle]  [Hand Up (Ack)]  [Finger Up (Insight)]  [Summon Terminal]  [Self Heal] |
|  [Simulate TTS + D3 Speech]       [Bind Live Mic Lip/Beat Sync]                         |
+-----------------------------------------------------------------------------------------+
```

---

## ◈ Physical Hardware Assembly Guide (The 10-Minute Removable Dock)

You can build a durable, removable, optical Pepper's Ghost dock for less than \$5 using basic household craft materials:

### Bill of Materials (BOM)
1. **Black Cardboard or Foam Board** (5mm thickness recommended, matte black).
2. **Clear Transparent Sheet** (Thin Acrylic / Plexiglass / PVC presentation cover sheet, $0.5\text{mm} - 2\text{mm}$).
3. **Black Electrical Tape / Masking Tape or Hot Glue**.
4. **Utility Knife / Box Cutter & Ruler**.

### Cut List Dimensions (Optimized for Standard 15.6" Laptops)

| Part | Name | Dimensions | Quantity | Function |
| :--- | :--- | :--- | :---: | :--- |
| **Piece 1** | **Back Vertical Wall** | $34.0\,\text{cm} \times 20.0\,\text{cm}$ | 1 | Stands at $90^\circ$ at the top edge of your screen. Blocks light and creates the black optical backdrop. |
| **Piece 2** | **Left Triangle** | $20.0\,\text{cm} \text{ (base)} \times 20.0\,\text{cm} \text{ (height)} \times 28.3\,\text{cm} \text{ (hypotenuse)}$ | 1 | $45^\circ$-$45^\circ$-$90^\circ$ right triangle forming the left side hood. |
| **Piece 3** | **Right Triangle** | $20.0\,\text{cm} \text{ (base)} \times 20.0\,\text{cm} \text{ (height)} \times 28.3\,\text{cm} \text{ (hypotenuse)}$ | 1 | Right side hood mirror of Piece 2. |
| **Piece 4 & 5**| **Front 45° Reflector** | $33.5\,\text{cm} \times 27.5\,\text{cm}$ (Clear sheet) + Cardboard frame | 1 | Transparent glass/PVC sheet glued into a slim cardboard frame resting at $45^\circ$. |

```text
                        SIDE PROFILE (45° ARCADE-HOOD GEOMETRY)

               Back Top (z = -20cm, y = +20cm)
                          *-------------------------*
                          | \                       |
                          |   \   Front 45° Glass   |  Piece 1:
                          |     \  (Piece 4 & 5)    |  Back Wall
        Piece 2 & 3:      |       \                 |  (34x20cm)
        Left & Right      |         \               |
        Triangles         |           \             |
        (20x20x28.3cm)    |             \           |
                          |               \         |
                          *=================\=======*
                  Laptop Hinge                      Back Bottom of Screen
                  (z = 0, y = 0)                    (z = -20cm, y = 0)
                  
                  <------- 180° FLAT DISPLAY SCREEN (Base B = 20cm) ------->
```

### Optical Ray Tracing & Reflection Physics
1. The laptop screen lies flat on the desk, projecting pixels vertically upward ($+Y$).
2. The light rays strike the underside of the $45^\circ$ slanted transparent sheet.
3. According to Fresnel reflection and Householder involution $\mathbf{R}_{\Pi} = \mathbf{I} - 2\mathbf{n}\mathbf{n}^T$, light reflects at a $90^\circ$ angle horizontally ($+Z$) directly into the user's eyes.
4. The user looks through the clear sheet into the pitch-black cardboard interior. The virtual character appears suspended in mid-air with true optical depth!

---

## ◈ Laptop Compatibility: 180° Flat Hinge vs. Standard Laptops

### Scenario A: Your Laptop Has a 180° Lay-Flat Hinge (Optimal)
If your laptop hinge opens fully to $180^\circ$ (common on ThinkPads, ASUS Zenbooks, Lenovo Yoga/Slim, Dell Latitudes, and modern business laptops):
1. Push the screen down until the keyboard and display lie completely flat on the desk.
2. Drop your glued One-Piece Dock directly over the screen half.
3. Sit at the keyboard and converse naturally with your floating hologram.

### Scenario B: Your Laptop Has a Standard Hinge (90° - 135° Maximum Opening)
**You do NOT need to buy a new laptop!** You can use any standard laptop with two simple alternative setups:
- **Option 1: Tent / Inverted Mode (Zero Extra Cost)**  
  Open your laptop to its widest angle ($\sim 120^\circ-135^\circ$), place it upside-down like a "tent", or lay the screen flat on the table with the keyboard propped up against a wall or book stand. The screen is now horizontal.
- **Option 2: External Wireless Keyboard / Mouse**  
  Lay the laptop down with the screen flat on an elevated riser and connect an external wireless keyboard on your desk.
- **Option 3: Tablet or Secondary Flat Screen**  
  You can run the web viewport on an iPad, Android tablet, or portable monitor laid flat on your desk while running the backend on your main computer.

---

## ◈ Display Resolutions & Device Compatibility Notice

> [!IMPORTANT]
> **Current Baseline**: The default optical camera and preset dimensions are baseline-calibrated for **15.6-inch displays (16:9 aspect ratio, Full HD $1920\times 1080$ or QHD $2560\times 1440$)**.
>
> **Multi-Resolution & Multi-Device Compatibility**:
> - **Coming Soon**: Native auto-scaling homography profiles for tablets (11" iPad, Samsung Tab), smartphones, and 27"/32" desktop displays are under active development for subsequent releases.
> - **Known Notice for Other Resolutions**: If you run on non-16:9 aspect ratios (e.g., 16:10, 21:9 ultrawide, or custom high-DPI scaling), you may experience minor FOV margin offsets or edge clipping.
> - **Live Calibration Workaround**: Click the **`📐 STAGE CALIB`** button on the top navigation bar to open the live Pythagorean Stage Calibrator. Adjust the **Base Width (mm)**, **Base Height (mm)**, and **Compensated FOV** sliders to instantly calibrate any screen size and aspect ratio in seconds!

---

## ◈ System Architecture

```text
+--------------------------------------------------------------------------------------------------+
|                        FRONTEND: THREE.JS + WEBGL HOLOGRAM ENGINE (60 FPS)                       |
|                                                                                                  |
|  +------------------------+   +------------------------------+   +----------------------------+  |
|  | Web Speech API + VAD   |   | Universal Rig Loader &       |   | Pepper's Ghost Optical     |  |
|  | (Mic Sensor -> Interim |   | Auto-Bone Mapper Studio      |   | Stage Calibration Engine   |  |
|  |  & Final STT Stream)   |   | (.glb/.vrm -> 28-Bone Map)   |   | (ScaleX/Y Flip, Pythagoras |  |
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

## ◈ Core Subsystems & Technical Specifications

### 1. Universal Rig Loader & Visual Bone Studio ([`RigLoader.ts`](frontend/src/rig/RigLoader.ts) / [`RigStudioDrawer.ts`](frontend/src/ui/RigStudioDrawer.ts))
- **Canonical 28-Joint Skeleton**: Standard humanoid joint schema (`pelvis`, `spine_01`, `spine_02`, `neck`, `head`, `jaw`, `clavicle_L/R`, `upper_arm_L/R`, `lower_arm_L/R`, `hand_L/R`, `thumb_L/R`, `index_L/R`, `middle_L/R`, `ring_L/R`, `pinky_L/R`, `upper_leg_L/R`, `lower_leg_L/R`).
- **Fuzzy Auto-Mapper**: Automatic regex matching across **Mixamo** (`mixamorigRightArm`), **Blender Rigify** (`upper_arm.R`), **VRoid / VRM** (`J_Bip_R_UpperArm`), and **Unreal Engine** (`upperarm_r`).
- **Rest-Pose Offset Calibration**: Solves T-pose / A-pose discrepancies and axis alignments:
  $$q_j^{\text{world}}(t) = q_j^{\text{bind}} \otimes q_j^{\text{calib}} \otimes q_j^{\text{dynamic}}(t)$$

### 2. 60Hz SO(3) Biomechanical Kinematics & Spring Physics ([`SpringSolver.ts`](frontend/src/kinematics/SpringSolver.ts))
- Every bone angle vector $\mathbf{\theta}_j(t) = (\alpha, \beta, \gamma)^T$ converges toward D3 target angles via a second-order critically damped semi-implicit differential solver ($\zeta = 1.0$, $\omega_n = 16\text{--}24\,\text{rad/s}$):
  $$\ddot{\mathbf{\theta}}_j(t) + 2\zeta\omega_n \dot{\mathbf{\theta}}_j(t) + \omega_n^2 (\mathbf{\theta}_j(t) - \mathbf{\theta}_j^{\text{target}}) = 0$$
- **Biological Idle Life ([`IdleLife.ts`](frontend/src/kinematics/IdleLife.ts))**: Procedural $0.24\,\text{Hz}$ diaphragmatic thoracic breathing coupled to spine and clavicles, plus Poisson-distributed ocular micro-saccades and spontaneous eye blinks.

### 3. Real-Time 512-FFT Viseme Analyzer & Prosodic Beat Coupling ([`VisemeAnalyzer.ts`](frontend/src/audio/VisemeAnalyzer.ts))
- Bins raw 24kHz audio into three formant energy bands:
  - Low ($E_{\text{low}}$, $100\text{--}450\,\text{Hz}$) $\to$ Drives articulated jaw pitch ($0\text{--}18^\circ$).
  - Mid ($E_{\text{mid}}$, $450\text{--}2200\,\text{Hz}$) $\to$ Drives lip corner spread (viseme `EE`).
  - High ($E_{\text{high}}$, $2200\text{--}6500\,\text{Hz}$) $\to$ Drives fricative constriction (viseme `SS`).
- **Conversational Beat Coupling**: Forearms and cervical spine subtly modulate with speech prosody rhythm:
  $$\Delta \theta = \kappa \cdot E_{\text{RMS}}(t) \cdot \sin(\omega_b t)$$

### 4. Floating Cybernetic Hologram Widgets ([`FloatingWidgets.ts`](frontend/src/shaders/FloatingWidgets.ts))
- **Left-Wrist Terminal**: An interactive 3D text plane anchored to the character's left wrist bone (`hand_L`) rendering live scrolling agent logs and stdout via an offscreen canvas texture with glowing borders and additive blending.
- **Sub-Agent Holographic Spawner**: Materializes a floating wireframe icosahedron with orbital particle rings beside the main avatar when background tool calls are executed, dissolving smoothly upon completion.

### 5. Zero-Latency Web Speech-to-Text & Sub-30ms Barge-In ([`SpeechSensor.ts`](frontend/src/audio/SpeechSensor.ts))
- Combines continuous Web Speech API recognition with an energy/zero-crossing WebAudio VAD.
- **Immediate Reflexes**: On `VAD_SPEECH_START` ($<30\,\text{ms}$), if the hologram is currently speaking, it flushes client audio buffers, emits an interrupt packet over WebSocket, and transitions into `listening_attentive` posture (slight head tilt and forward lean).
- **Speculative D3 Pre-Warm**: When an interim transcript stabilizes for $>350\,\text{ms}$, a speculative preview is dispatched to pre-compute acknowledgement gestures before the user even finishes speaking!

### 6. Decoupled Dual-System Architecture (System 1 Decision Engine + System 2 Chat LLM)
`XeroHoloGram` enforces a strict architectural separation between **physical decision-making** and **conversational speech**:

```text
+--------------------------------------------------------------------------------------------------+
|                                    USER UTTERANCE / INPUT STREAM                                 |
+------------------------------------------------+-------------------------------------------------+
                                                 |
                +--------------------------------+-------------------------------+
                |                                                                |
                v                                                                v
+-------------------------------+                               +----------------------------------+
| SYSTEM 1: vLLM DECISION ENGINE|                               | SYSTEM 2: OPENAI CHAT LLM (VOICE)|
| (https://decision.vllm-sr.ai) |                               | (OpenAI / Groq / Ollama / etc.)  |
|                               |                               |                                  |
| • Model: vllm-sr/d3-flash     |                               | • Real-time token streaming      |
| • 52-Key Round-Robin Pool     |                               | • ClauseChunker boundary parser  |
| • Calibrated Probabilities    |                               | • 24kHz Streaming TTS (EdgeTTS)  |
| • 1 Forward Pass (Sub-100ms)  |                               | • Prosodic viseme beat coupling  |
+---------------+---------------+                               +----------------+-----------------+
                |                                                                |
                v                                                                v
+-------------------------------+                               +----------------------------------+
| STREAM B: KINEMATICS & TOOLS  |                               | STREAM A: SPOKEN VOICE STREAM    |
| • SO(3) 60Hz Spring Physics   |                               | • Articulated jaw pitch sync     |
| • Cervical spine gaze target  |                               | • Envelope follower dynamics     |
| • Left-wrist terminal HUD     |                               | • Sub-250ms voice latency        |
| • Holographic Fresnel shader  |                               | • Sub-30ms barge-in reflex       |
+-------------------------------+                               +----------------------------------+
```

- **52-Key Round-Robin Proxy Pool ([`key_pool.py`](backend/app/llm/key_pool.py))**:
  Maintains 52 high-capacity Decision API keys (`sk-vsr-`) in an asynchronous pool with automatic rate-limit cooldown tracking (`429 Retry-After`) and instant failover.
- **Single Forward Pass Decision Resolution ([`vllm_decision_client.py`](backend/app/llm/vllm_decision_client.py))**:
  Queries `POST /v1/systemone` asking typed choice questions for intent, emotion, tool needs, and urgency. Receives calibrated probability scores without text-generation latency.
- **Industrial Geist UI & Precision Rectangles**:
  - Official **Geist Variable Font** with high-contrast uppercase tracking.
  - Deep black and dark grey linear gradients (`#161618` $\to$ `#09090b`) preserving the `#000000` void for Pepper's Ghost transparency.
  - Strict, non-curvy standard rectangles (`border-radius: 2px`).
  - Zero emojis: 100% crisp, geometric monochrome vector SVGs ([`HoloIcons.ts`](frontend/src/ui/HoloIcons.ts)).

---

## ◈ Quickstart & Installation

### Prerequisites
- **[Bun](https://bun.sh)** (v1.1+) or **Node.js** (v20+)
- **Python 3.10+** (Python 3.11 / 3.12 / 3.14 recommended)
- A modern WebGL2-capable browser (Chrome, Edge, Firefox, Brave)

### 1. One-Click / Single-Command Launch (Fastest)

Clone the repository and run the single launcher script:

```bash
# Clone repository
git clone https://github.com/Xero-cooks/XeroHoloGram.git
cd XeroHoloGram

# Windows (Double-click or run from terminal):
run.bat

# PowerShell:
.\run.ps1

# Universal Python / Mac / Linux:
python start.py
# or:
npm start / bun start
```

This single script automatically:
1. Detects Python, Bun/Node, and validates environment dependencies.
2. Cleans up any conflicting or dangling processes on ports `8765` and `5173`.
3. Launches the Backend Multiplexer Daemon on `ws://localhost:8765/ws/hologram`.
4. Launches the 60 FPS Three.js WebGL Hologram Viewport on `http://localhost:5173`.
5. Automatically opens your default web browser to the hologram viewport.
6. Gracefully shuts down both background processes when you press `Ctrl+C`.

### 2. Manual Developer Setup

If you prefer running services in separate terminal windows:

#### Terminal 1: Backend Multiplexer Daemon
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start FastAPI Uvicorn Server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8765 --reload
```

#### Terminal 2: Frontend Viewport
```bash
# Install frontend dependencies
bun install --cwd frontend

# Start Vite development server
bun run --cwd frontend dev
```

Open `http://localhost:5173` in your browser. Click **🎙 MIC: OFF** in the top navigation bar to activate the microphone stream.

### 3. Running Unit Tests

The codebase includes an extensive suite of frontend and backend unit tests:

```bash
# Run 38 Frontend Unit Tests (SO(3) math, spring solver, FFT visemes, VAD, optics, widgets)
bun test frontend/tests

# Run 14 Backend Unit Tests (D3 schema, clause chunker, state machine, barge-in, latency)
pytest backend/tests

# Verify Production Bundle Compilation
cd frontend && bun run build && cd ..
```

---

## ◈ D3 Kinematic Gesture Library

The D3 engine maps conversational intent to structured JSON keyframes using atomic angle presets:

| Preset Name | Target Pose & Anatomical Action | Intended Conversational Context |
| :--- | :--- | :--- |
| `neutral` | Upright relaxed posture, arms loosely hanging, subtle breathing. | Resting baseline state. |
| `listening_attentive` | Head tilted $+5^\circ$, spine leaned forward $+4^\circ$, eyes alert. | Active user speech listening & acknowledgement. |
| `hand_up_ack` | Right forearm raised $+72^\circ$, palm open, head slight tilt. | Agreement, turn transition, casual greeting. |
| `finger_up_insight` | Left arm raised $+85^\circ$, index finger pointing upward. | Sharing a key insight, idea, or architecture point. |
| `thinking_chin_touch`| Right hand near chin, head tilted down $-10^\circ$, gaze deflected. | Reasoning, deep inference, database search. |
| `terminal_summon` | Left wrist raised $+90^\circ$ toward chest, head looking down at wrist. | Activating wrist terminal, reviewing execution logs. |
| `self_heal` | Both forearms crossed inward $+75^\circ$, chest pitched forward. | Recovering from context errors, restart, self-repair. |
| `greeting_wave` | Right arm elevated, forearm oscillating horizontally $\pm 25^\circ$. | Hello, initial boot sequence, session greeting. |

---

## ◈ Roadmap & Community

- [x] **v1.0.0**: 60Hz SO(3) Kinematics, 28-Joint Standard Rig, Built-in XeroKratos Avatar, D3 Decision Engine, Dual-Stream Multiplexer, One-Piece 15.6" Cardboard Dock Blueprint.
- [ ] **v1.1.0 (In Progress)**: Multi-resolution auto-calibration homography solver for tablets (11" iPad/Galaxy Tab) and external 27" monitors.
- [ ] **v1.2.0**: Webcam-based gaze tracking via MediaPipe FaceMesh to lock character eye contact onto the viewer's physical head position.
- [ ] **v1.3.0**: Quantized local LLM & ONNX TTS pipeline for 100% offline edge execution.
- [ ] **v1.4.0**: Multi-agent mesh: Materialize 3 distinct holographic characters concurrently on a panoramic multi-dock stage.

### Contributing
Contributions are warmly welcomed! Please submit issues, feature proposals, and pull requests following our [Conventional Commits](https://www.conventionalcommits.org/) standards.

---

## ◈ License

Distributed under the **Apache 2.0 License**. See [`LICENSE`](LICENSE) for full details. Open-source, permissive, and built for universal maker adoption.
