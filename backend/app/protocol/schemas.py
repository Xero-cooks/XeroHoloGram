from typing import List, Optional, Tuple, Literal
from pydantic import BaseModel, Field


class SpeechInterimPacket(BaseModel):
    type: Literal["speech_interim"] = "speech_interim"
    session_id: str
    text: str
    timestamp_ms: Optional[int] = None


class SpeechFinalPacket(BaseModel):
    type: Literal["speech_final"] = "speech_final"
    session_id: str
    text: str
    timestamp_ms: Optional[int] = None


class BargeInPacket(BaseModel):
    type: Literal["barge_in"] = "barge_in"
    session_id: str
    timestamp_ms: Optional[int] = None


class BargeInAckPacket(BaseModel):
    type: Literal["barge_in_ack"] = "barge_in_ack"
    session_id: str
    status: Literal["flushed", "ignored"] = "flushed"
    timestamp_ms: Optional[int] = None


class GestureCommand(BaseModel):
    bone: str
    rotation_euler: Tuple[float, float, float]
    duration_ms: int = 400


class GazeCommand(BaseModel):
    target: Tuple[float, float, float] = (0.0, 1.5, 2.0)
    eye_contact_ratio: float = 0.85


class EmotionState(BaseModel):
    valence: float = Field(default=0.0, ge=-1.0, le=1.0)
    arousal: float = Field(default=0.0, ge=-1.0, le=1.0)


class HologramFXState(BaseModel):
    scanline_speed: float = 1.0
    rim_glow_intensity: float = 1.0
    bloom_boost: float = 0.0


class KinematicFramePacket(BaseModel):
    type: Literal["kinematic_frame"] = "kinematic_frame"
    sequence_id: int
    gestures: List[GestureCommand] = Field(default_factory=list)
    gaze: GazeCommand = Field(default_factory=GazeCommand)
    emotion: EmotionState = Field(default_factory=EmotionState)
    hologram_fx: HologramFXState = Field(default_factory=HologramFXState)


class HeartbeatPacket(BaseModel):
    type: Literal["heartbeat"] = "heartbeat"
    timestamp_ms: int
