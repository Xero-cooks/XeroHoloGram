import asyncio
import logging
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from backend.app.main import app
from backend.app.ws.connection_manager import ConnectionManager
from backend.app.state_machine.turn_machine import TurnStateMachine, TurnState
from backend.app.state_machine.barge_in_handler import BargeInHandler
from backend.app.state_machine.speculative_prewarmer import SpeculativePrewarmer
from backend.app.llm.llm_client import StreamingLLMClient
from backend.app.chunker.clause_chunker import ClauseChunker
from backend.app.tts.edge_adapter import EdgeTTSAdapter
from backend.app.tts.base_adapter import BaseTTSAdapter
from backend.app.kinematics.d3_engine import D3KinematicDecisionEngine
from backend.app.protocol.audio_packer import AudioPacker
from backend.app.protocol.telemetry import LatencyTelemetry

logger = logging.getLogger("MultiplexerDaemon")

# Global daemon singletons
connection_manager = ConnectionManager()
barge_in_handler = BargeInHandler(connection_manager)
prewarmer = SpeculativePrewarmer()
telemetry = LatencyTelemetry()
llm_client = StreamingLLMClient()
d3_engine = D3KinematicDecisionEngine()


async def process_conversational_turn(
    session_id: str,
    user_prompt: str,
    tts_adapter: BaseTTSAdapter,
    state_machine: TurnStateMachine
):
    state_machine.transition_to(TurnState.THINKING)
    telemetry.record_turn_start(session_id)

    chunker = ClauseChunker()
    messages = [{"role": "user", "content": user_prompt}]
    sequence_id = 0

    try:
        async for token in llm_client.stream_chat(messages):
            clauses = chunker.feed_token(token)
            for clause in clauses:
                await execute_parallel_streams(session_id, clause, tts_adapter, state_machine, sequence_id)
                sequence_id += 1

        # Flush any remaining tokens
        final_clauses = chunker.flush()
        for clause in final_clauses:
            await execute_parallel_streams(session_id, clause, tts_adapter, state_machine, sequence_id)
            sequence_id += 1

        state_machine.transition_to(TurnState.IDLE)
    except asyncio.CancelledError:
        logger.info(f"[{session_id}] Conversational turn cancelled via barge-in.")
        raise


async def execute_parallel_streams(
    session_id: str,
    clause: str,
    tts_adapter: BaseTTSAdapter,
    state_machine: TurnStateMachine,
    sequence_id: int
):
    state_machine.transition_to(TurnState.SPEAKING)

    # Stream B: D3 Kinematic evaluation
    kinematic_packet = d3_engine.evaluate_clause(clause)
    kinematic_packet.sequence_id = sequence_id
    await connection_manager.send_json(session_id, kinematic_packet.model_dump())

    # Stream A: Voice Audio synthesis
    is_first_chunk = True
    async for pcm_chunk in tts_adapter.synthesize_stream(clause):
        if is_first_chunk:
            telemetry.record_first_chunk(session_id)
            is_first_chunk = False

        num_samples = len(pcm_chunk) // 2
        binary_frame = AudioPacker.pack_audio_frame(
            sequence_id=sequence_id,
            sample_rate=tts_adapter.sample_rate,
            num_samples=num_samples,
            flags=0,
            pcm_bytes=pcm_chunk
        )
        await connection_manager.send_binary(session_id, binary_frame)


@app.websocket("/ws/hologram")
async def websocket_hologram_endpoint(websocket: WebSocket, session_id: str = "default_hologram_session"):
    session = await connection_manager.connect(session_id, websocket)
    state_machine = TurnStateMachine(session_id)
    default_tts = EdgeTTSAdapter()

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type in ("speech_interim", "interim_transcript"):
                prewarmer.on_interim_text(session_id, data.get("text", ""))

            elif msg_type in ("speech_final", "final_transcript", "prompt_test", "prompt_request"):
                text = data.get("text", "")
                if session.in_flight_task and not session.in_flight_task.done():
                    session.in_flight_task.cancel()

                session.in_flight_task = asyncio.create_task(
                    process_conversational_turn(session_id, text, default_tts, state_machine)
                )

            elif msg_type == "barge_in":
                await barge_in_handler.handle_barge_in(session_id, state_machine, session.in_flight_task)

            elif msg_type in ("heartbeat", "ping"):
                ts = data.get("timestamp", data.get("timestamp_ms", 0))
                await connection_manager.send_json(session_id, {"type": "pong", "timestamp": ts})

            elif msg_type == "llm_config":
                if "base_url" in data and data["base_url"]:
                    llm_client.base_url = data["base_url"].rstrip("/")
                if "api_key" in data and data["api_key"]:
                    llm_client.api_key = data["api_key"]
                if "model" in data and data["model"]:
                    llm_client.model = data["model"]
                if "system_prompt" in data and data["system_prompt"]:
                    llm_client.system_prompt = data["system_prompt"]
                if "tts_voice" in data and data["tts_voice"]:
                    default_tts._voice = data["tts_voice"]

                await connection_manager.send_json(session_id, {
                    "type": "config_ack",
                    "status": "updated",
                    "model": llm_client.model,
                    "tts_voice": getattr(default_tts, "_voice", "default")
                })

    except WebSocketDisconnect:
        connection_manager.disconnect(session_id)
        if session.in_flight_task and not session.in_flight_task.done():
            session.in_flight_task.cancel()
