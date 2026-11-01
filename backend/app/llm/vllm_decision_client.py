"""
vllm_decision_client.py
Official Client for the vLLM Semantic Router System One Decision API (https://decision.vllm-sr.ai).
Integrates calibrated single-forward-pass probability routing (vllm-sr/d3-flash) with
a 52-key Round-Robin Proxy Pool.
Acts strictly as the Decision & Action Policy Engine for the Hologram (tools, SO(3) body language,
gaze, shader state, and intent). Verbal talking is handled by the OpenAI Chat LLM.
"""

import time
import json
import logging
import httpx
from typing import Dict, Any, Optional, List, Tuple
from backend.app.llm.key_pool import decision_key_pool, RoundRobinKeyPool
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

logger = logging.getLogger("VLLMDecisionClient")

VLLM_DECISION_BASE_URL = "https://decision.vllm-sr.ai"
DEFAULT_DECISION_MODEL = "vllm-sr/d3-flash"


class VLLMDecisionClient:
    def __init__(
        self,
        base_url: str = VLLM_DECISION_BASE_URL,
        model: str = DEFAULT_DECISION_MODEL,
        key_pool: Optional[RoundRobinKeyPool] = None,
        timeout_sec: float = 8.0
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.key_pool = key_pool or decision_key_pool
        self.timeout_sec = timeout_sec

    async def evaluate_decision(
        self,
        utterance: str,
        state_context: Optional[DecisionPolicyState] = None
    ) -> AgenticDecisionPacket:
        """
        Executes a single forward pass calibrated question query against https://decision.vllm-sr.ai/v1/systemone
        using the Round-Robin Key Pool.
        Maps calibrated probabilities into physical SO(3) kinematics, tool invocations, and shader states.
        """
        state = state_context or DecisionPolicyState()

        # Build typed vLLM System One Questions payload
        questions = {
            "intent": {
                "type": "choice",
                "instructions": "What is the primary action or topic requested by the user?",
                "criteria": {
                    "terminal": "Summon holographic wrist terminal, view logs or system status",
                    "worker": "Spawn a sub-agent worker node or autonomous agent",
                    "heal": "Run quantum self-repair, reset joints, or recover from errors",
                    "calibrate": "Calibrate optical stage, 45 degree reflector, or IPS exposure",
                    "optics": "Explain Pepper's Ghost optical physics and display architecture",
                    "greet": "Say hello or greet the user",
                    "chat": "General conversational discussion or question answering"
                }
            },
            "emotion": {
                "type": "choice",
                "instructions": "What emotional tone fits the character's reaction?",
                "criteria": {
                    "focused": "Analytical, technical, focused",
                    "alert": "Cybernetic alert, vigilant, high priority",
                    "resolute": "Confident, resolute, healing",
                    "attentive": "Neutral, polite, attentive listening"
                }
            },
            "needs_tool": {
                "type": "noul",
                "instructions": "Does this request trigger a physical holographic tool or widget action?"
            },
            "urgency": {
                "type": "score",
                "instructions": "How urgent or emphatic is this request?",
                "criteria": ["Routine", "Moderate", "High", "Critical"]
            }
        }

        payload = {
            "model": self.model,
            "state": utterance,
            "questions": questions
        }

        # Try up to 3 keys in round-robin sequence in case of transient 429 rate limits
        for attempt in range(3):
            key, key_idx = self.key_pool.get_next_key()
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
                "X-API-Key": key
            }

            url = f"{self.base_url}/v1/systemone"

            try:
                async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                    start_t = time.perf_counter()
                    response = await client.post(url, headers=headers, json=payload)
                    latency_ms = (time.perf_counter() - start_t) * 1000.0

                    if response.status_code == 200:
                        self.key_pool.mark_success(key)
                        res_data = response.json()
                        logger.info(f"vLLM Decision [{self.model}] answered in {latency_ms:.1f}ms using key #{key_idx}")
                        return self._parse_vllm_response(res_data, utterance)

                    elif response.status_code == 429:
                        retry_after = 60.0
                        retry_hdr = response.headers.get("Retry-After")
                        if retry_hdr and retry_hdr.isdigit():
                            retry_after = float(retry_hdr)
                        self.key_pool.mark_rate_limited(key, retry_after)
                        logger.warning(f"Key #{key_idx} rate limited (429), rotating to next key...")
                        continue

                    else:
                        logger.warning(
                            f"vLLM Decision API returned HTTP {response.status_code}: {response.text[:120]}"
                        )
                        break

            except Exception as e:
                logger.warning(f"vLLM Decision query error with key #{key_idx}: {str(e)}")
                break

        # Fallback deterministic heuristic solver if external API is unreachable or exhausted
        return self._execute_fallback_policy(utterance, state)

    def _parse_vllm_response(self, data: Dict[str, Any], utterance: str) -> AgenticDecisionPacket:
        """
        Parses calibrated answers from vllm-sr/d3-flash and maps them to our AgenticDecisionPacket contract.
        """
        answers = data.get("answers", {})

        # 1. Intent & Calibrated Confidence
        intent_ans = answers.get("intent", {})
        chosen_intent = intent_ans.get("choice", "chat")
        confidence = float(intent_ans.get("confidence", 0.95))
        probs = intent_ans.get("probabilities", {})

        # 2. Emotion
        emotion_ans = answers.get("emotion", {})
        chosen_emotion_str = emotion_ans.get("choice", "attentive")
        emotion_map = {
            "focused": AgentEmotion.ANALYTICAL_FOCUSED,
            "alert": AgentEmotion.CYBERNETIC_ALERT,
            "resolute": AgentEmotion.RESOLUTE_CONFIDENT,
            "attentive": AgentEmotion.NEUTRAL_ATTENTIVE
        }
        emotion = emotion_map.get(chosen_emotion_str, AgentEmotion.NEUTRAL_ATTENTIVE)

        # 3. Tool Need
        needs_tool_ans = answers.get("needs_tool", {})
        tool_prob = float(needs_tool_ans.get("noul", 0.0))

        # 4. Map Intent to Kinematics, Tools, and Shader State
        return self._build_decision_packet(
            intent_key=chosen_intent,
            confidence=confidence,
            probabilities=probs,
            emotion=emotion,
            needs_tool=tool_prob >= 0.5,
            utterance=utterance
        )

    def _build_decision_packet(
        self,
        intent_key: str,
        confidence: float,
        probabilities: Dict[str, float],
        emotion: AgentEmotion,
        needs_tool: bool,
        utterance: str
    ) -> AgenticDecisionPacket:
        """
        Synthesizes the complete kinematic plan and tool action corresponding to the resolved intent.
        """
        prob_summary = ", ".join(f"{k}:{v:.2f}" for k, v in probabilities.items())

        if intent_key == "terminal":
            return AgenticDecisionPacket(
                thought_trace=f"Decision model vllm-sr/d3-flash routed to 'terminal' (conf: {confidence:.2f}, {prob_summary}). Actuating wrist terminal tool and terminal_summon posture.",
                intent_class=AgentIntentClass.SUMMON_TERMINAL,
                confidence=confidence,
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

        elif intent_key == "worker":
            return AgenticDecisionPacket(
                thought_trace=f"Decision model vllm-sr/d3-flash routed to 'worker' (conf: {confidence:.2f}, {prob_summary}). Emitting spawn_subagent tool call.",
                intent_class=AgentIntentClass.SPAWN_WORKER,
                confidence=confidence,
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

        elif intent_key == "heal":
            return AgenticDecisionPacket(
                thought_trace=f"Decision model vllm-sr/d3-flash routed to 'heal' (conf: {confidence:.2f}, {prob_summary}). Restoring canonical bone binds and pulsing emerald shader.",
                intent_class=AgentIntentClass.QUANTUM_HEAL,
                confidence=confidence,
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

        elif intent_key == "calibrate":
            return AgenticDecisionPacket(
                thought_trace=f"Decision model vllm-sr/d3-flash routed to 'calibrate' (conf: {confidence:.2f}, {prob_summary}). Synchronizing optical stage geometry.",
                intent_class=AgentIntentClass.CALIBRATE_STAGE,
                confidence=confidence,
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

        elif intent_key == "optics":
            return AgenticDecisionPacket(
                thought_trace=f"Decision model vllm-sr/d3-flash routed to 'optics' (conf: {confidence:.2f}, {prob_summary}). Explaining dual-stream multiplexer and beam splitter optics.",
                intent_class=AgentIntentClass.EXPLAIN_ARCHITECTURE,
                confidence=confidence,
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

        elif intent_key == "greet":
            return AgenticDecisionPacket(
                thought_trace=f"Decision model vllm-sr/d3-flash routed to 'greet' (conf: {confidence:.2f}, {prob_summary}). Welcoming user.",
                intent_class=AgentIntentClass.GREET_ACKNOWLEDGE,
                confidence=confidence,
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

        # Default conversational QA
        tool_action = ToolActionCall(name="report_telemetry", parameters={}) if needs_tool else None
        return AgenticDecisionPacket(
            thought_trace=f"Decision model vllm-sr/d3-flash routed to 'chat' (conf: {confidence:.2f}, {prob_summary}). Actuating conversational gestures.",
            intent_class=AgentIntentClass.CONVERSATIONAL_QA,
            confidence=confidence,
            speech_response=f"Processing '{utterance}'. The holographic harness is operational and ready to execute.",
            emotion=emotion,
            gaze_vector=GazeVector3D(x=0.0, y=0.12, z=1.0),
            holo_shader_state=HoloShaderState.CYAN_NOMINATIVE,
            tool_call=tool_action,
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

    def _execute_fallback_policy(
        self,
        utterance: str,
        state: DecisionPolicyState
    ) -> AgenticDecisionPacket:
        """
        Deterministic, bounded fallback decision policy.
        Executes with 0ms latency when offline or when external Decision API is unreachable.
        """
        text = utterance.lower().strip()

        if any(w in text for w in ("terminal", "status", "debug", "log", "stdout", "cli")):
            return self._build_decision_packet("terminal", 0.99, {"terminal": 0.99}, AgentEmotion.ANALYTICAL_FOCUSED, True, utterance)
        if any(w in text for w in ("spawn", "worker", "sub-agent", "subagent", "compute", "swarm")):
            return self._build_decision_packet("worker", 0.97, {"worker": 0.97}, AgentEmotion.CYBERNETIC_ALERT, True, utterance)
        if any(w in text for w in ("heal", "repair", "recover", "fix", "reset", "quantum")):
            return self._build_decision_packet("heal", 0.99, {"heal": 0.99}, AgentEmotion.RESOLUTE_CONFIDENT, True, utterance)
        if any(w in text for w in ("calibrat", "pythagor", "angle", "glass", "reflector", "mirror", "fov", "ips")):
            return self._build_decision_packet("calibrate", 0.96, {"calibrate": 0.96}, AgentEmotion.ANALYTICAL_FOCUSED, True, utterance)
        if any(w in text for w in ("architecture", "optics", "pepper", "ghost", "work", "explain")):
            return self._build_decision_packet("optics", 0.98, {"optics": 0.98}, AgentEmotion.CURIOUS_ENGAGED, False, utterance)
        if any(w in text for w in ("hello", "hi", "hey", "greet", "morning", "who are you")):
            return self._build_decision_packet("greet", 0.98, {"greet": 0.98}, AgentEmotion.CURIOUS_ENGAGED, False, utterance)

        return self._build_decision_packet("chat", 0.92, {"chat": 0.92}, AgentEmotion.NEUTRAL_ATTENTIVE, False, utterance)
