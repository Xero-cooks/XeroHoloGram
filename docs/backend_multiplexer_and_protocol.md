# Backend Async Multiplexer Daemon & WebSocket Protocol

## 1. Protocol Architecture
The full-duplex communication between the WebGL Hologram Engine and the FastAPI Multiplexer Daemon operates over `/ws/hologram` with multiplexed JSON control packets and binary raw PCM audio chunks.

### Packet Types
- `speech_interim` (Client -> Server): Streaming provisional ASR tokens.
- `speech_final` (Client -> Server): Finalized user utterance, triggering conversational inference.
- `barge_in` (Client -> Server): VAD speech interruption trigger.
- `barge_in_ack` (Server -> Client): Cancellation confirmation.
- `kinematic_frame` (Server -> Client): Synchronized 3D gesture overrides, gaze target, emotion, and hologram shader effects.
- **Binary PCM Frame** (Server -> Client): 16-byte header + Int16 raw PCM audio samples.

---

## 2. Binary Audio Header Format
Every binary audio frame transmitted from server to client starts with a fixed 16-byte header packed as 4 little-endian `uint32` values:

```
+--------------------+--------------------+--------------------+--------------------+
| sequence_id (u32)  | sample_rate (u32)  | num_samples (u32)  |    flags (u32)     |
|     (4 bytes)      |     (4 bytes)      |     (4 bytes)      |     (4 bytes)      |
+--------------------+--------------------+--------------------+--------------------+
|                           Raw Int16 PCM Audio Bytes...                            |
+-----------------------------------------------------------------------------------+
```

---

## 3. Sub-50ms Barge-In Cancellation Sequence
When a user begins speaking while the holographic agent is rendering audio or gesturing:
1. Client VAD detects energy onset ($< 20\text{ms}$).
2. Client sends `{"type": "barge_in", "session_id": "..."}`.
3. Client immediately flushes `AudioJitterBuffer` and zeroes kinematic angular velocities.
4. Server cancels in-flight LLM/TTS `asyncio.Task`.
5. Server drains send queues and sends `barge_in_ack`.
6. Avatar smoothly returns to active listening pose.
