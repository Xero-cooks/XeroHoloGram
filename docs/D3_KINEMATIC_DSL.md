# D3 Kinematic DSL Specification

## 1. Structured JSON Kinematic Packet Schema
The D3 Decision Engine generates structured kinematic packets defining multi-beat gesture timelines, gaze targeting, and holographic shader states:

```json
{
  "intent_class": "explain_architecture",
  "emotion": "focused_confident",
  "gaze_vector": [0.0, 0.12, 1.0],
  "holo_shader_state": "cyan_nominative",
  "gesture_sequence": [
    {
      "trigger_ms": 0,
      "duration_ms": 950,
      "base_preset": "hand_up_ack",
      "blend_weight": 0.9,
      "bone_angle_overrides_deg": {
        "neck": [6, -10, 3],
        "upper_arm_R": [48, -15, -38],
        "lower_arm_R": [72, 0, 0],
        "index_R": [0, 0, 0]
      }
    },
    {
      "trigger_ms": 950,
      "duration_ms": 1800,
      "base_preset": "finger_up_insight",
      "blend_weight": 1.0,
      "bone_angle_overrides_deg": {
        "spine_01": [5, 8, 0],
        "upper_arm_L": [55, 20, 35],
        "hand_L": [-12, 0, 0]
      }
    }
  ]
}
```

## 2. Dynamic Holo Shader States
- `cyan_nominative`: Standard holographic cyan rim ($I_{\text{rim}} \approx 1.0$)
- `amber_alert`: Warning or state transition ($I_{\text{rim}} \approx 1.6$, amber tint)
- `magenta_glitch`: Tool execution / memory query (chromatic dispersion pulse)
- `emerald_healed`: System recovered / self-healed state
