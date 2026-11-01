import asyncio
import logging
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from backend.app.main import app
from backend.app.ws.connection_manager import ConnectionManager
from backend.app.state_machine.turn_machine import TurnStateMachine, TurnState
from backend.app.state_machine.barge_in_handler import BargeInHandler
from backend.app.state_machine.speculative_prewarmer import SpeculativePrewarmer
from backend.app.llm.decision_llm import DecisionLLMEngine
from backend.app.chunker.clause_chunker import ClauseChunker
from backend.app.tts.edge_adapter import EdgeTTSAdapter
from backend.app.tts.base_adapter import BaseTTSAdapter
from backend.app.protocol.audio_packer import AudioPacker
from backend.app.protocol.telemetry import LatencyTelemetry

logger = logging.getLogger("MultiplexerDaemon")

# Global daemon singletons
connection_manager = ConnectionManager()
barge_in_handler = BargeInHandler(connection_manager)
prewarmer = SpeculativePrewarmer()
telemetry = LatencyTelemetry()
decision_llm = DecisionLLMEngine()


async def process_conversational_turn(
    session_id: str,
    user_prompt: str,
    tts_adapter: BaseTTSAdapter,
    state_machine: TurnStateMachine
):
    state_machine.transition_to(TurnState.THINKING)
    telemetry.record_turn_start(session_id)

    try:
        # Step 1: Decision-Based LLM Evaluation (Bounded intent, confidence, tools, SO(3) plan)
        decision = await decision_llm.evaluate_decision(user_prompt)

        # Step 2: Stream B - Broadcast structured Decision Packet & Kinematics immediately
        decision_data = decision.model_dump()
        await connection_manager.send_json(session_id, {
            "type": "decision_packet",
            **decision_data
        })

        # Backward compatibility for pure d3_kinematics listeners
        await connection_manager.send_json(session_id, {
            "type": "d3_kinematics",
            "intent_class": decision.intent_class.value,
            "emotion": decision.emotion.value,
            "gaze_vector": [decision.gaze_vector.x, decision.gaze_vector.y, decision.gaze_vector.z],
            "holo_shader_state": decision.holo_shader_state.value,
            "gesture_sequence": [k.model_dump() for k in decision.gesture_sequence]
        })

        # Step 3: Tool Execution Trigger
        if decision.tool_call:
            await connection_manager.send_json(session_id, {
                "type": "tool_action_trigger",
                "name": decision.tool_call.name,
                "parameters": decision.tool_call.parameters
            })

        # Step 4: Stream A - Clause-chunked 24kHz Audio Synthesis
        state_machine.transition_to(TurnState.SPEAKING)
        chunker = ClauseChunker()
        sequence_id = 0

        # Feed the speech response tokens/words into the clause chunker
        for word in decision.speech_response.split(" "):
            clauses = chunker.feed_token(word + " ")
            for clause in clauses:
                await synthesize_and_send_audio(session_id, clause, tts_adapter, sequence_id)
                sequence_id += 1

        final_clauses = chunker.flush()
        for clause in final_clauses:
            await synthesize_and_send_audio(session_id, clause, tts_adapter, sequence_id)
            sequence_id += 1

        state_machine.transition_to(TurnState.IDLE)

    except asyncio.CancelledError:
        logger.info(f"[{session_id}] Conversational turn cancelled via barge-in.")
        raise
    except Exception as e:
        logger.error(f"[{session_id}] Turn error: {str(e)}", exc_info=True)
        state_machine.transition_to(TurnState.IDLE)


async def synthesize_and_send_audio(
    session_id: str,
    clause: str,
    tts_adapter: BaseTTSAdapter,
    sequence_id: int
):
    if not clause.strip():
        return

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
                decision_llm.update_config(
                    base_url=data.get("base_url"),
                    api_key=data.get("api_key"),
                    model=data.get("model"),
                    system_prompt=data.get("system_prompt")
                )
                if "tts_voice" in data and data["tts_voice"]:
                    default_tts._voice = data["tts_voice"]

                await connection_manager.send_json(session_id, {
                    "type": "config_ack",
                    "status": "updated",
                    "model": decision_llm.model,
                    "tts_voice": getattr(default_tts, "_voice", "default")
                })

    except WebSocketDisconnect:
        connection_manager.disconnect(session_id)
        if session.in_flight_task and not session.in_flight_task.done():
            session.in_flight_task.cancel()
