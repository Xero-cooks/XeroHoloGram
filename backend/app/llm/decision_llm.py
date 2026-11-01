"""
decision_llm.py
Decision-Based LLM Engine for the Agentic Hologram Harness.
Enforces bounded decision policies, typed JSON schema contracts, calibrated confidence scoring,
tool call emission, and physical SO(3) kinematic action synthesis.
"""

import os
import json
import logging
import httpx
from typing import Dict, Any, Optional, List
from backend.app.schemas.decision_schema import (
    AgenticDecisionPacket,
    AgentIntentClass,
    AgentEmotion,
    HoloShaderState,
    ToolActionCall,
    GazeVector3D,
    KinematicKeyframe,
    DecisionPolicyState,
)

logger = logging.getLogger("DecisionLLMEngine")


DECISION_SYSTEM_PROMPT = """You are XeroKratos, an ultra-advanced 3D Holographic AI Agent in a Pepper's Ghost optical display harness.
You are not a passive text generator; you operate as a Bounded Decision Policy.

For every user prompt, you evaluate:
1. Current world/stage state and tool availability.
2. The user's underlying goal and intent class.
3. Your decision confidence score [0.0 - 1.0].
4. An actionable tool invocation (if relevant).
5. A concise, sharp, spoken response suitable for 24kHz audio synthesis.
6. A physical kinematic action plan with timed SO(3) keyframes and joint angles.
7. Gaze vector and holographic Fresnel shader state.

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT conforming strictly to this schema:
{
  "thought_trace": "step-by-step reasoning about the intent, tools, and kinematics",
  "intent_class": "explain_architecture" | "summon_terminal" | "spawn_worker" | "quantum_heal" | "calibrate_stage" | "conversational_qa" | "greet_acknowledge" | "emergency_halt",
  "confidence": 0.98,
  "speech_response": "Concise spoken response for the user...",
  "emotion": "neutral_attentive" | "analytical_focused" | "curious_engaged" | "resolute_confident" | "empathetic_reassuring" | "cybernetic_alert",
  "gaze_vector": {"x": 0.0, "y": 0.12, "z": 1.0},
  "holo_shader_state": "cyan_nominative" | "magenta_glitch" | "emerald_healed" | "amber_warning" | "deep_blue_focus",
  "tool_call": {
    "name": "summon_wrist_terminal" | "spawn_subagent" | "execute_quantum_heal" | "set_shader_palette" | "calibrate_stage" | "report_telemetry",
    "parameters": {"key": "value"}
  } or null,
  "gesture_sequence": [
    {
      "trigger_ms": 0,
      "duration_ms": 950,
      "base_preset": "neutral" | "hand_up_ack" | "finger_up_insight" | "terminal_summon" | "self_heal" | "thinking_chin_touch" | "listening_attentive",
      "blend_weight": 1.0,
      "bone_angle_overrides_deg": {
        "joint_name": [rotX, rotY, rotZ]
      }
    }
  ]
}
"""


class DecisionLLMEngine:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        system_prompt: Optional[str] = None
    ):
        self.base_url = (base_url or os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")).rstrip("/")
        self.api_key = api_key or os.getenv("LLM_API_KEY", "")
        self.model = model or os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.system_prompt = system_prompt or DECISION_SYSTEM_PROMPT
        self.history: List[Dict[str, str]] = []

    def update_config(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> None:
        if base_url:
            self.base_url = base_url.rstrip("/")
        if api_key is not None:
            self.api_key = api_key
        if model:
            self.model = model
        if system_prompt:
            self.system_prompt = system_prompt
        logger.info(f"DecisionLLMEngine config updated: model={self.model}, base_url={self.base_url}")

    async def evaluate_decision(
        self,
        utterance: str,
        state_context: Optional[DecisionPolicyState] = None
    ) -> AgenticDecisionPacket:
        """
        Main decision loop.
        Queries the Decision LLM with JSON schema enforcement.
        If offline, unconfigured, or on invalid JSON, triggers Deterministic Fallback Decision Policy.
        """
        state = state_context or DecisionPolicyState()

        # If API key is dummy, empty, or mock -> execute fallback directly with <1ms latency
        if not self.api_key or self.api_key in ("mock-key", "default-key", ""):
            return self._execute_fallback_policy(utterance, state)

        # Build context injection
        state_prompt = (
            f"\n\nCURRENT AGENT STATE: pose={state.current_pose}, optical_calibrated={state.optical_calibrated}, "
            f"flip_x={state.stage_flip_x}, ips_boost={state.ips_boost_active}, "
            f"available_tools={state.available_tools}"
        )

        messages = [
            {"role": "system", "content": self.system_prompt + state_prompt},
            *self.history[-4:],
            {"role": "user", "content": utterance}
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        url = f"{self.base_url}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    packet_dict = json.loads(content)
                    decision = AgenticDecisionPacket.model_validate(packet_dict)

                    # Store in conversation memory
                    self.history.append({"role": "user", "content": utterance})
                    self.history.append({"role": "assistant", "content": decision.speech_response})
                    if len(self.history) > 10:
                        self.history = self.history[-10:]

                    return decision
                else:
                    logger.warning(f"Decision LLM HTTP error {response.status_code}, activating fallback policy.")
        except Exception as e:
            logger.warning(f"Decision LLM query failed ({str(e)}), activating fallback policy.")

        return self._execute_fallback_policy(utterance, state)

    def _execute_fallback_policy(
        self,
        utterance: str,
        state: DecisionPolicyState
    ) -> AgenticDecisionPacket:
        """
        Deterministic, bounded decision policy solver.
        Executes with 0ms latency when offline or when external model is unavailable.
        Guarantees strict schema adherence, correct kinematic keyframes, and valid tool actions.
        """
        text = utterance.lower().strip()

        # 1. Holographic Wrist Terminal Summon
        if any(w in text for w in ("terminal", "status", "debug", "log", "stdout", "cli")):
            return AgenticDecisionPacket(
                thought_trace="User requested system telemetry and status logs. Actuating wrist terminal tool and terminal_summon posture.",
                intent_class=AgentIntentClass.SUMMON_TERMINAL,
                confidence=0.99,
                speech_response="Holographic wrist terminal deployed. Displaying real-time system diagnostics and telemetry stream.",
                emotion=AgentEmotion.ANALYTICAL_FOCUSED,
                gaze_vector=GazeVector3D(x=-0.2, y=0.15, z=0.85),
                holo_shader_state=HoloShaderState.MAGENTA_GLITCH,
                tool_call=ToolActionCall(
                    name="summon_wrist_terminal",
                    parameters={"display_mode": "diagnostics", "target_joint": "lower_arm_L"}
                ),
                gesture_sequence=[
                    KinematicKeyframe(
                        trigger_ms=0,
                        duration_ms=1200,
                        base_preset="terminal_summon",
                        blend_weight=1.0,
                        bone_angle_overrides_deg={
                            "upper_arm_L": [60.0, 30.0, 40.0],
                            "lower_arm_L": [90.0, 0.0, 20.0],
                            "hand_L": [0.0, 15.0, -10.0],
                            "head": [12.0, 15.0, -4.0]
                        }
                    )
                ]
            )

        # 2. Sub-Agent Worker Spawner
        if any(w in text for w in ("spawn", "worker", "sub-agent", "subagent", "compute", "swarm")):
            return AgenticDecisionPacket(
                thought_trace="User instructed sub-agent deployment. Emitting spawn_subagent tool call and spawning cybernetic orb.",
                intent_class=AgentIntentClass.SPAWN_WORKER,
                confidence=0.97,
                speech_response="Sub-agent worker node initialized. Allocating auxiliary task pipeline in holographic space.",
                emotion=AgentEmotion.CYBERNETIC_ALERT,
                gaze_vector=GazeVector3D(x=0.25, y=0.18, z=0.9),
                holo_shader_state=HoloShaderState.CYAN_NOMINATIVE,
                tool_call=ToolActionCall(
                    name="spawn_subagent",
                    parameters={"worker_id": "worker-alpha", "task": "parallel_pipeline"}
                ),
                gesture_sequence=[
                    KinematicKeyframe(
                        trigger_ms=0,
                        duration_ms=1000,
                        base_preset="hand_up_ack",
                        blend_weight=0.95,
                        bone_angle_overrides_deg={
                            "upper_arm_R": [55.0, -20.0, -30.0],
                            "neck": [-4.0, 8.0, 0.0]
                        }
                    )
                ]
            )

        # 3. Quantum Heal / Self Repair
        if any(w in text for w in ("heal", "repair", "recover", "fix", "reset", "quantum")):
            return AgenticDecisionPacket(
                thought_trace="System heal requested. Restoring canonical bone binds, flushing jitter buffers, and pulsing emerald shader.",
                intent_class=AgentIntentClass.QUANTUM_HEAL,
                confidence=0.99,
                speech_response="Initiating quantum self-repair sequence. Resetting SO(3) springs and harmonizing holographic phase.",
                emotion=AgentEmotion.RESOLUTE_CONFIDENT,
                gaze_vector=GazeVector3D(x=0.0, y=0.22, z=1.0),
                holo_shader_state=HoloShaderState.EMERALD_HEALED,
                tool_call=ToolActionCall(
                    name="execute_quantum_heal",
                    parameters={"reset_springs": True, "clear_buffers": True}
                ),
                gesture_sequence=[
                    KinematicKeyframe(
                        trigger_ms=0,
                        duration_ms=1500,
                        base_preset="self_heal",
                        blend_weight=1.0,
                        bone_angle_overrides_deg={
                            "spine_01": [-6.0, 0.0, 0.0],
                            "upper_arm_L": [35.0, 25.0, 40.0],
                            "upper_arm_R": [35.0, -25.0, -40.0]
                        }
                    )
                ]
            )

        # 4. Optical Stage Calibration & Pepper's Ghost
        if any(w in text for w in ("calibrat", "pythagor", "angle", "glass", "reflector", "mirror", "fov", "ips")):
            return AgenticDecisionPacket(
                thought_trace="User inquiring or requesting stage calibration. Reporting 45-degree beam splitter and FOV perspective parameters.",
                intent_class=AgentIntentClass.CALIBRATE_STAGE,
                confidence=0.96,
                speech_response="Pepper's Ghost stage optics are locked at 45 degrees. Horizontal scale is inverted for mirror reflection with IPS panel exposure compensation.",
                emotion=AgentEmotion.ANALYTICAL_FOCUSED,
                gaze_vector=GazeVector3D(x=0.0, y=0.1, z=1.0),
                holo_shader_state=HoloShaderState.CYAN_NOMINATIVE,
                tool_call=ToolActionCall(
                    name="calibrate_stage",
                    parameters={"glass_angle_deg": 45.0, "flip_x": True, "ips_boost": True}
                ),
                gesture_sequence=[
                    KinematicKeyframe(
                        trigger_ms=0,
                        duration_ms=1100,
                        base_preset="thinking_chin_touch",
                        blend_weight=0.9,
                        bone_angle_overrides_deg={"neck": [-6.0, -8.0, 4.0], "upper_arm_R": [70.0, -15.0, -30.0]}
                    )
                ]
            )

        # 5. Architecture Explanation
        if any(w in text for w in ("architecture", "optics", "pepper", "ghost", "work", "explain")):
            return AgenticDecisionPacket(
                thought_trace="Explaining complete dual-stream harness: 60Hz SO(3) spring kinematics, 24kHz PCM audio, and optical projection.",
                intent_class=AgentIntentClass.EXPLAIN_ARCHITECTURE,
                confidence=0.98,
                speech_response="I operate through a dual-stream multiplexer. Stream A streams 24kHz audio, while Stream B evaluates SO(3) Lie group kinematics at 60 FPS, suspended on your 45-degree glass.",
                emotion=AgentEmotion.CURIOUS_ENGAGED,
                gaze_vector=GazeVector3D(x=0.0, y=0.12, z=1.0),
                holo_shader_state=HoloShaderState.CYAN_NOMINATIVE,
                tool_call=ToolActionCall(
                    name="report_telemetry",
                    parameters={"query": "architecture_summary"}
                ),
                gesture_sequence=[
                    KinematicKeyframe(
                        trigger_ms=0,
                        duration_ms=900,
                        base_preset="hand_up_ack",
                        blend_weight=0.9,
                        bone_angle_overrides_deg={"upper_arm_R": [45.0, -15.0, -20.0]}
                    ),
                    KinematicKeyframe(
                        trigger_ms=900,
                        duration_ms=1600,
                        base_preset="finger_up_insight",
                        blend_weight=1.0,
                        bone_angle_overrides_deg={"upper_arm_R": [75.0, -20.0, -35.0], "head": [6.0, -3.0, 2.0]}
                    )
                ]
            )

        # 6. Greeting / Acknowledgement
        if any(w in text for w in ("hello", "hi", "hey", "greet", "morning", "who are you")):
            return AgenticDecisionPacket(
                thought_trace="User initiated contact. Welcoming user and presenting cybernetic avatar.",
                intent_class=AgentIntentClass.GREET_ACKNOWLEDGE,
                confidence=0.98,
                speech_response="Greetings. I am XeroKratos, your 3D holographic agent. Ready for instructions.",
                emotion=AgentEmotion.CURIOUS_ENGAGED,
                gaze_vector=GazeVector3D(x=0.0, y=0.1, z=1.0),
                holo_shader_state=HoloShaderState.CYAN_NOMINATIVE,
                tool_call=None,
                gesture_sequence=[
                    KinematicKeyframe(
                        trigger_ms=0,
                        duration_ms=1200,
                        base_preset="hand_up_ack",
                        blend_weight=1.0,
                        bone_angle_overrides_deg={"neck": [4.0, 0.0, 0.0], "upper_arm_R": [50.0, -15.0, -20.0]}
                    )
                ]
            )

        # 7. Conversational QA Fallback
        return AgenticDecisionPacket(
            thought_trace=f"General conversational query. Formulating thoughtful verbal response with attentive posture.",
            intent_class=AgentIntentClass.CONVERSATIONAL_QA,
            confidence=0.92,
            speech_response=f"Understood. I am processing '{utterance}'. The holographic harness is operational and ready to execute.",
            emotion=AgentEmotion.NEUTRAL_ATTENTIVE,
            gaze_vector=GazeVector3D(x=0.0, y=0.12, z=1.0),
            holo_shader_state=HoloShaderState.CYAN_NOMINATIVE,
            tool_call=None,
            gesture_sequence=[
                KinematicKeyframe(
                    trigger_ms=0,
                    duration_ms=1000,
                    base_preset="thinking_chin_touch",
                    blend_weight=0.85,
                    bone_angle_overrides_deg={"neck": [-5.0, -8.0, 3.0]}
                ),
                KinematicKeyframe(
                    trigger_ms=1000,
                    duration_ms=1500,
                    base_preset="finger_up_insight",
                    blend_weight=0.95,
                    bone_angle_overrides_deg={"upper_arm_R": [65.0, -18.0, -28.0]}
                )
            ]
        )
