from enum import Enum
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class Canonical28Joint(str, Enum):
    pelvis = "pelvis"
    spine_01 = "spine_01"
    spine_02 = "spine_02"
    neck = "neck"
    head = "head"
    jaw = "jaw"
    clavicle_L = "clavicle_L"
    clavicle_R = "clavicle_R"
    upper_arm_L = "upper_arm_L"
    upper_arm_R = "upper_arm_R"
    lower_arm_L = "lower_arm_L"
    lower_arm_R = "lower_arm_R"
    hand_L = "hand_L"
    hand_R = "hand_R"
    thumb_L = "thumb_L"
    thumb_R = "thumb_R"
    index_L = "index_L"
    index_R = "index_R"
    middle_L = "middle_L"
    middle_R = "middle_R"
    ring_L = "ring_L"
    ring_R = "ring_R"
    pinky_L = "pinky_L"
    pinky_R = "pinky_R"
    upper_leg_L = "upper_leg_L"
    upper_leg_R = "upper_leg_R"
    lower_leg_L = "lower_leg_L"
    lower_leg_R = "lower_leg_R"


EulerAngleVector = Tuple[float, float, float]


class D3GestureKeyframe(BaseModel):
    trigger_ms: int = 0
    duration_ms: int = 950
    base_preset: str = "neutral"
    blend_weight: float = Field(default=1.0, ge=0.0, le=1.0)
    bone_angle_overrides_deg: Dict[str, EulerAngleVector] = Field(default_factory=dict)


class D3KinematicResponse(BaseModel):
    intent_class: str = "conversational_inform"
    emotion: str = "neutral_attentive"
    gaze_vector: Tuple[float, float, float] = (0.0, 0.12, 1.0)
    holo_shader_state: str = "cyan_nominative"
    gesture_sequence: List[D3GestureKeyframe] = Field(default_factory=list)
