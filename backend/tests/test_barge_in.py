import asyncio
import pytest
from backend.app.ws.connection_manager import ConnectionManager
from backend.app.state_machine.turn_machine import TurnStateMachine, TurnState
from backend.app.state_machine.barge_in_handler import BargeInHandler


class MockWebSocket:
    def __init__(self):
        self.sent_messages = []

    async def accept(self):
        pass

    async def send_json(self, data: dict):
        self.sent_messages.append(data)


def test_barge_in_instant_cancellation():
    async def run_test():
        manager = ConnectionManager()
        mock_ws = MockWebSocket()
        session = await manager.connect("sess_bargein", mock_ws)

        state_machine = TurnStateMachine("sess_bargein")
        state_machine.transition_to(TurnState.LISTENING)
        state_machine.transition_to(TurnState.THINKING)
        state_machine.transition_to(TurnState.SPEAKING)

        handler = BargeInHandler(manager)

        # Simulated long-running TTS generation task
        async def long_speech_task():
            await asyncio.sleep(10.0)

        task = asyncio.create_task(long_speech_task())

        # Trigger barge-in
        success = await handler.handle_barge_in("sess_bargein", state_machine, task)

        assert success is True
        assert task.cancelled() or task.done()
        assert state_machine.state == TurnState.LISTENING

        # Verify ack dispatched
        assert len(mock_ws.sent_messages) == 1
        assert mock_ws.sent_messages[0]["type"] == "barge_in_ack"
        assert mock_ws.sent_messages[0]["status"] == "flushed"

    asyncio.run(run_test())
