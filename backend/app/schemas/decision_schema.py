"""
decision_schema.py
Strict typed schemas and bounded state/action spaces for the Decision-Based LLM Agent.
Implements bounded intent classification, calibrated confidence, tool calling contracts,
and physical SO(3) kinematic action sequences.
"""

from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field


class AgentIntentClass(str, Enum):
    EXPLAIN_ARCHITECTURE = "explain_architecture"
    SUMMON_TERMINAL = "summon_terminal"
    SPAWN_WORKER = "spawn_worker"
    QUANTUM_HEAL = "quantum_heal"
    CALIBRATE_STAGE = "calibrate_stage"
    CONVERSATIONAL_QA = "conversational_qa"
    GREET_ACKNOWLEDGE = "greet_acknowledge"
    EMERGENCY_HALT = "emergency_halt"


class AgentEmotion(str, Enum):
    NEUTRAL_ATTENTIVE = "neutral_attentive"
    ANALYTICAL_FOCUSED = "analytical_focused"
    CURIOUS_ENGAGED = "curious_engaged"
    RESOLUTE_CONFIDENT = "resolute_confident"
    EMPATHETIC_REASSURING = "empathetic_reassuring"
    CYBERNETIC_ALERT = "cybernetic_alert"


class HoloShaderState(str, Enum):
    CYAN_NOMINATIVE = "cyan_nominative"
    MAGENTA_GLITCH = "magenta_glitch"
    EMERALD_HEALED = "emerald_healed"
    AMBER_WARNING = "amber_warning"
    DEEP_BLUE_FOCUS = "deep_blue_focus"


class ToolActionCall(BaseModel):
    name: str = Field(description="Name of the executable tool actuator")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Typed parameter key-value dictionary")


class GazeVector3D(BaseModel):
    x: float = Field(default=0.0, ge=-1.0, le=1.0)
    y: float = Field(default=0.12, ge=-1.0, le=1.0)
    z: float = Field(default=1.0, ge=-1.0, le=1.0)

    def to_tuple(self) -> Tuple[float, float, float]:
        return (self.x, self.y, self.z)


class KinematicKeyframe(BaseModel):
    trigger_ms: int = Field(default=0, ge=0, description="Start offset in ms from turn initiation")
    duration_ms: int = Field(default=950, gt=0, description="Duration of this gesture phase in ms")
    base_preset: str = Field(default="neutral", description="Base posture preset identifier")
    blend_weight: float = Field(default=1.0, ge=0.0, le=1.0, description="Blend weight into spring target")
    bone_angle_overrides_deg: Dict[str, Tuple[float, float, float]] = Field(
        default_factory=dict,
        description="Explicit Euler angle overrides in degrees (X, Y, Z) per canonical joint"
    )


class DecisionPolicyState(BaseModel):
    """
    Observable world state vector injected into the Decision LLM policy evaluator.
    """
    turn_index: int = 0
    current_pose: str = "neutral"
    optical_calibrated: bool = True
    stage_flip_x: bool = True
    ips_boost_active: bool = True
    available_tools: List[str] = Field(
        default_factory=lambda: [
            "summon_wrist_terminal",
            "spawn_subagent",
            "execute_quantum_heal",
            "set_shader_palette",
            "calibrate_stage",
            "report_telemetry"
        ]
    )


class AgenticDecisionPacket(BaseModel):
    """
    Unified Decision-Based LLM Contract:
    Encapsulates bounded intent, chain-of-thought rationale, spoken verbal response,
    calibrated confidence, physical kinematics, and tool invocation.
    """
    thought_trace: str = Field(
        default="",
        description="Bounded chain-of-thought scratchpad explaining the rationale behind the decision"
    )
    intent_class: AgentIntentClass = Field(
        default=AgentIntentClass.CONVERSATIONAL_QA,
        description="Discrete policy intent classification"
    )
    confidence: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Calibrated model decision confidence score"
    )
    speech_response: str = Field(
        description="The verbal dialogue response synthesized for streaming TTS delivery"
    )
    emotion: AgentEmotion = Field(
        default=AgentEmotion.NEUTRAL_ATTENTIVE,
        description="Agent emotional state driving facial blendshapes and posture dampening"
    )
    gaze_vector: GazeVector3D = Field(
        default_factory=GazeVector3D,
        description="Look-at direction vector for cervical spine solver"
    )
    holo_shader_state: HoloShaderState = Field(
        default=HoloShaderState.CYAN_NOMINATIVE,
        description="Active holographic shader palette for Pepper's Ghost transparency"
    )
    tool_call: Optional[ToolActionCall] = Field(
        default=None,
        description="Actionable tool execution trigger"
    )
    gesture_sequence: List[KinematicKeyframe] = Field(
        default_factory=list,
        description="Ordered sequence of kinetic keyframes dispatched to the 60Hz SO(3) spring solver"
    )
