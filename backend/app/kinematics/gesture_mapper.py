from typing import List, Tuple
from backend.app.protocol.schemas import GestureCommand


class SemanticGestureMapper:
    @staticmethod
    def map_cues(text: str) -> List[GestureCommand]:
        text_lower = text.lower()
        commands: List[GestureCommand] = []

        if any(w in text_lower for w in ["welcome", "hello", "hi", "greetings"]):
            # Friendly greeting open hand
            commands.append(GestureCommand(bone="RightUpperArm", rotation_euler=(-0.40, 0.25, -0.20), duration_ms=800))
            commands.append(GestureCommand(bone="RightLowerArm", rotation_euler=(0.0, 0.45, 0.0), duration_ms=800))
            commands.append(GestureCommand(bone="Head", rotation_euler=(0.10, 0.0, 0.0), duration_ms=500))

        elif any(w in text_lower for w in ["think", "wonder", "perhaps", "maybe"]):
            # Pensive head tilt
            commands.append(GestureCommand(bone="Head", rotation_euler=(-0.08, -0.15, 0.10), duration_ms=1000))

        elif any(w in text_lower for w in ["absolutely", "definitely", "yes", "exactly"]):
            # Double emphatic nod
            commands.append(GestureCommand(bone="Head", rotation_euler=(0.22, 0.0, 0.0), duration_ms=450))

        return commands
