from backend.app.schemas.d3_dsl import D3KinematicResponse, D3GestureKeyframe, Canonical28Joint
from backend.app.engines.d3_decision import D3DecisionEngine


def test_d3_schema_serialization():
    keyframe = D3GestureKeyframe(
        trigger_ms=0,
        duration_ms=950,
        base_preset="hand_up_ack",
        blend_weight=0.9,
        bone_angle_overrides_deg={
            "neck": (6.0, -10.0, 3.0),
            "upper_arm_R": (48.0, -15.0, -38.0),
            "lower_arm_R": (72.0, 0.0, 0.0),
        }
    )

    resp = D3KinematicResponse(
        intent_class="explain_architecture",
        emotion="focused_confident",
        gaze_vector=(0.0, 0.12, 1.0),
        holo_shader_state="cyan_nominative",
        gesture_sequence=[keyframe]
    )

    dumped = resp.model_dump()
    assert dumped["intent_class"] == "explain_architecture"
    assert len(dumped["gesture_sequence"]) == 1
    assert dumped["gesture_sequence"][0]["bone_angle_overrides_deg"]["neck"] == (6.0, -10.0, 3.0)


def test_d3_engine_decisions():
    engine = D3DecisionEngine()

    # Test interim acknowledgement preview
    interim_resp = engine.generate_kinematics("I was wondering if", interim=True)
    assert interim_resp.intent_class == "acknowledging_interim"
    assert interim_resp.gesture_sequence[0].base_preset == "listening_attentive"

    # Test terminal summon trigger
    terminal_resp = engine.generate_kinematics("Open the system terminal status")
    assert terminal_resp.intent_class == "summon_terminal"
    assert terminal_resp.holo_shader_state == "magenta_glitch"

    # Test self heal trigger
    heal_resp = engine.generate_kinematics("Execute self heal diagnostic routine")
    assert heal_resp.intent_class == "self_healing"
    assert heal_resp.holo_shader_state == "emerald_healed"
