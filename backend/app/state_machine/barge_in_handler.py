import asyncio
import logging
from typing import Optional
from backend.app.ws.connection_manager import ConnectionManager
from backend.app.state_machine.turn_machine import TurnStateMachine, TurnState
from backend.app.protocol.schemas import BargeInAckPacket

logger = logging.getLogger("BargeInHandler")


class BargeInHandler:
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager

    async def handle_barge_in(
        self,
        session_id: str,
        state_machine: TurnStateMachine,
        in_flight_task: Optional[asyncio.Task] = None
    ) -> bool:
        logger.info(f"[{session_id}] Executing instant barge-in cancellation...")

        # 1. Cancel in-flight parallel generation task
        if in_flight_task and not in_flight_task.done():
            in_flight_task.cancel()
            try:
                await in_flight_task
            except asyncio.CancelledError:
                logger.info(f"[{session_id}] In-flight generation task cancelled cleanly.")

        # 2. Transition state machine
        state_machine.transition_to(TurnState.BARGED_IN)

        # 3. Dispatch barge_in_ack to client
        ack = BargeInAckPacket(session_id=session_id, status="flushed")
        await self.connection_manager.send_json(session_id, ack.model_dump())

        # 4. Ready to listen again
        state_machine.transition_to(TurnState.LISTENING)
        return True
