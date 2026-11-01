import logging
from enum import Enum
from typing import Callable, List, Optional

logger = logging.getLogger("TurnStateMachine")


class TurnState(str, Enum):
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    THINKING = "THINKING"
    SPEAKING = "SPEAKING"
    BARGED_IN = "BARGED_IN"


class TurnStateMachine:
    VALID_TRANSITIONS = {
        TurnState.IDLE: [TurnState.LISTENING, TurnState.THINKING],
        TurnState.LISTENING: [TurnState.THINKING, TurnState.IDLE, TurnState.BARGED_IN],
        TurnState.THINKING: [TurnState.SPEAKING, TurnState.BARGED_IN, TurnState.IDLE],
        TurnState.SPEAKING: [TurnState.BARGED_IN, TurnState.IDLE, TurnState.LISTENING],
        TurnState.BARGED_IN: [TurnState.LISTENING, TurnState.IDLE],
    }

    def __init__(self, session_id: str, on_transition: Optional[Callable[[TurnState, TurnState], None]] = None):
        self.session_id = session_id
        self.state: TurnState = TurnState.IDLE
        self.on_transition = on_transition

    def transition_to(self, new_state: TurnState) -> bool:
        if new_state == self.state:
            return True

        allowed = self.VALID_TRANSITIONS.get(self.state, [])
        if new_state not in allowed:
            logger.warning(
                f"[{self.session_id}] Illegal state transition: {self.state} -> {new_state}. Allowed: {allowed}"
            )
            return False

        old_state = self.state
        self.state = new_state
        logger.info(f"[{self.session_id}] Turn state transition: {old_state} -> {new_state}")

        if self.on_transition:
            self.on_transition(old_state, new_state)

        return True

    def reset(self):
        self.state = TurnState.IDLE
