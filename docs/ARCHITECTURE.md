# System Architecture: Agentic-Hologram / XeroHoloGram

## 1. High-Level Subsystem Topology
`Agentic-Hologram` orchestrates ultra-low-latency dual-stream AI interactions for physical Pepper's Ghost optical stages and standard 3D web viewports.

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

## 2. Parallel Dual Streams
1. **Stream A (Acoustic Pipeline)**:
   - Evaluates LLM tokens with prosodic clause boundary chunking (>6 words or punctuation `.` `,` `;` `!` `?` `—`).
   - Dispatches audio chunks via Edge-TTS / Kokoro-82M / ElevenLabs / Cartesia.
2. **Stream B (D3 Kinematics Pipeline)**:
   - High-speed semantic gesture decision model returning bone angle overrides ($\alpha, \beta, \gamma$), emotional valence/arousal, and hologram shader uniforms.
   - Synchronized by millisecond triggers matching acoustic timeline.
