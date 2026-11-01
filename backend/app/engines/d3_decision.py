import json
import logging
from typing import Dict, List, Optional
from backend.app.schemas.d3_dsl import D3KinematicResponse, D3GestureKeyframe

logger = logging.getLogger("D3DecisionEngine")


class D3DecisionEngine:
    def __init__(self):
        pass

    def generate_kinematics(self, utterance: str, interim: bool = False) -> D3KinematicResponse:
        """
        Synthesizes structured D3 kinematic timeline from transcript.
        Runs with sub-250ms latency using heuristic and prompt template logic.
        """
        text = utterance.lower()

        if interim:
            # Speculative acknowledgement preview before user finishes speaking
            return D3KinematicResponse(
                intent_class="acknowledging_interim",
                emotion="focused_attentive",
                gaze_vector=(0.0, 0.08, 1.0),
                holo_shader_state="cyan_nominative",
                gesture_sequence=[
                    D3GestureKeyframe(
                        trigger_ms=0,
                        duration_ms=450,
                        base_preset="listening_attentive",
                        blend_weight=0.9,
                        bone_angle_overrides_deg={"neck": [4, -4, 4], "head": [3, -2, 2]}
                    )
                ]
            )

        # Final transcript decision
        if "terminal" in text or "status" in text or "system" in text or "code" in text:
            return D3KinematicResponse(
                intent_class="summon_terminal",
                emotion="analytical",
                gaze_vector=(-0.15, 0.15, 0.8),
                holo_shader_state="magenta_glitch",
                gesture_sequence=[
                    D3GestureKeyframe(
                        trigger_ms=0,
                        duration_ms=1200,
                        base_preset="terminal_summon",
                        blend_weight=1.0,
                        bone_angle_overrides_deg={
                            "upper_arm_L": [60, 30, 40],
                            "lower_arm_L": [90, 0, 20],
                            "hand_L": [0, 15, -10],
                            "head": [12, 15, -4]
                        }
                    )
                ]
            )

        if "heal" in text or "fix" in text or "recover" in text or "restart" in text:
            return D3KinematicResponse(
                intent_class="self_healing",
                emotion="resolute",
                gaze_vector=(0.0, 0.20, 1.0),
                holo_shader_state="emerald_healed",
                gesture_sequence=[
                    D3GestureKeyframe(
                        trigger_ms=0,
                        duration_ms=1400,
                        base_preset="self_heal",
                        blend_weight=1.0,
                        bone_angle_overrides_deg={
                            "spine_01": [-6, 0, 0],
                            "upper_arm_L": [35, 25, 40],
                            "upper_arm_R": [35, -25, -40]
                        }
                    )
                ]
            )

        if "?" in utterance or "why" in text or "how" in text or "what" in text:
            return D3KinematicResponse(
                intent_class="explain_insight",
                emotion="curious_engaged",
                gaze_vector=(0.0, 0.12, 1.0),
                holo_shader_state="cyan_nominative",
                gesture_sequence=[
                    D3GestureKeyframe(
                        trigger_ms=0,
                        duration_ms=900,
                        base_preset="thinking_chin_touch",
                        blend_weight=0.9,
                        bone_angle_overrides_deg={"neck": [-8, -12, 6], "upper_arm_R": [75, -20, -35]}
                    ),
                    D3GestureKeyframe(
                        trigger_ms=900,
                        duration_ms=1600,
                        base_preset="finger_up_insight",
                        blend_weight=1.0,
                        bone_angle_overrides_deg={"spine_01": [5, 8, 0], "upper_arm_L": [55, 20, 35]}
                    )
                ]
            )

        # Standard conversational explanation
        return D3KinematicResponse(
            intent_class="conversational_affirm",
            emotion="confident",
            gaze_vector=(0.0, 0.10, 1.0),
            holo_shader_state="cyan_nominative",
            gesture_sequence=[
                D3GestureKeyframe(
                    trigger_ms=0,
                    duration_ms=800,
                    base_preset="hand_up_ack",
                    blend_weight=0.85,
                    bone_angle_overrides_deg={
                        "neck": [6, -8, 2],
                        "upper_arm_R": [45, -12, -30],
                        "lower_arm_R": [65, 0, 0]
                    }
                )
            ]
        )
