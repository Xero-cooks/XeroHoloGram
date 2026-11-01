from typing import List
from backend.app.protocol.schemas import (
    KinematicFramePacket,
    GestureCommand,
    GazeCommand,
    EmotionState,
    HologramFXState
)


class D3KinematicDecisionEngine:
    def __init__(self):
        self.sequence_id = 0

    def evaluate_clause(self, clause: str) -> KinematicFramePacket:
        self.sequence_id += 1
        text_lower = clause.lower()

        gestures: List[GestureCommand] = []
        gaze = GazeCommand()
        emotion = EmotionState()
        fx = HologramFXState()

        # Semantic gesture decisions
        if "?" in clause:
            # Questioning: Head tilt, eye contact boost
            gestures.append(GestureCommand(bone="Head", rotation_euler=(-0.05, 0.12, -0.15), duration_ms=800))
            gaze.target = (0.0, 1.5, 1.8)
            gaze.eye_contact_ratio = 0.95
        elif "you" in text_lower or "look" in text_lower or "here" in text_lower:
            # Indicating / pointing forward with right arm
            gestures.append(GestureCommand(bone="RightUpperArm", rotation_euler=(-0.35, 0.20, -0.15), duration_ms=700))
            gestures.append(GestureCommand(bone="RightLowerArm", rotation_euler=(0.0, 0.40, 0.0), duration_ms=700))
        elif "!" in clause or "important" in text_lower or "crucial" in text_lower:
            # Emphatic assertion nod + hologram bloom boost
            gestures.append(GestureCommand(bone="Head", rotation_euler=(0.20, 0.0, 0.0), duration_ms=500))
            gestures.append(GestureCommand(bone="Chest", rotation_euler=(0.06, 0.0, 0.0), duration_ms=600))
            emotion.arousal = 0.7
            emotion.valence = 0.5
            fx.rim_glow_intensity = 1.6
            fx.bloom_boost = 0.4
        else:
            # Gentle rhythmic conversational nod
            gestures.append(GestureCommand(bone="Head", rotation_euler=(0.08, 0.0, 0.0), duration_ms=600))

        return KinematicFramePacket(
            sequence_id=self.sequence_id,
            gestures=gestures,
            gaze=gaze,
            emotion=emotion,
            hologram_fx=fx
        )
