import asyncio
import logging
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from backend.app.main import app
from backend.app.ws.connection_manager import ConnectionManager
from backend.app.state_machine.turn_machine import TurnStateMachine, TurnState
from backend.app.state_machine.barge_in_handler import BargeInHandler
from backend.app.state_machine.speculative_prewarmer import SpeculativePrewarmer
from backend.app.llm.vllm_decision_client import VLLMDecisionClient
from backend.app.llm.openai_chat_client import OpenAIChatClient
from backend.app.llm.key_pool import decision_key_pool
from backend.app.chunker.clause_chunker import ClauseChunker
from backend.app.tts.edge_adapter import EdgeTTSAdapter
from backend.app.tts.base_adapter import BaseTTSAdapter
from backend.app.protocol.audio_packer import AudioPacker
from backend.app.protocol.telemetry import LatencyTelemetry
from backend.app.config_store import config_store

logger = logging.getLogger("MultiplexerDaemon")

# Global daemon singletons initialized with persistent disk config
initial_cfg = config_store.get()

connection_manager = ConnectionManager()
barge_in_handler = BargeInHandler(connection_manager)
prewarmer = SpeculativePrewarmer()
telemetry = LatencyTelemetry()
decision_client = VLLMDecisionClient(key_pool=decision_key_pool)
chat_client = OpenAIChatClient(
    base_url=initial_cfg.get("baseUrl"),
    api_key=initial_cfg.get("apiKey"),
    model=initial_cfg.get("model", "gpt-4o-mini"),
    system_prompt=initial_cfg.get("systemPrompt")
)
default_tts = EdgeTTSAdapter(
    voice=initial_cfg.get("ttsVoice", "en-US-ChristopherNeural"),
    rate=initial_cfg.get("ttsRate", "+0%")
)

# Aliases for status API introspection
llm_client = chat_client
d3_engine = decision_client

if initial_cfg.get("decisionModel"):
    decision_client.model = initial_cfg["decisionModel"]


def sync_runtime_config(new_cfg: dict):
    """Synchronizes in-memory singletons when configuration changes."""
    chat_client.update_config(
        base_url=new_cfg.get("baseUrl") or new_cfg.get("base_url"),
        api_key=new_cfg.get("apiKey") if "apiKey" in new_cfg else new_cfg.get("api_key"),
        model=new_cfg.get("model"),
        system_prompt=new_cfg.get("systemPrompt") or new_cfg.get("system_prompt")
    )
    if new_cfg.get("decisionModel") or new_cfg.get("decision_model"):
        decision_client.model = new_cfg.get("decisionModel") or new_cfg.get("decision_model")
    if new_cfg.get("ttsVoice") or new_cfg.get("tts_voice"):
        default_tts._voice = new_cfg.get("ttsVoice") or new_cfg.get("tts_voice")
    if new_cfg.get("ttsRate") or new_cfg.get("tts_rate"):
        default_tts._rate = new_cfg.get("ttsRate") or new_cfg.get("tts_rate")
    logger.info(f"Runtime singletons synchronized with config: {new_cfg.get('model')}")


async def process_conversational_turn(
    session_id: str,
    user_prompt: str,
    tts_adapter: BaseTTSAdapter,
    state_machine: TurnStateMachine
):
    state_machine.transition_to(TurnState.THINKING)
    telemetry.record_turn_start(session_id)

    try:
        # Step 1: Decision Model (vLLM Semantic Router System One / vllm-sr/d3-flash)
        # Evaluates calibrated probabilities for intent, tools, SO(3) physical posture, gaze & shader
        decision = await decision_client.evaluate_decision(user_prompt)

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

        # Step 4: Stream A - Conversational Chat LLM for spoken voice stream
        state_machine.transition_to(TurnState.SPEAKING)
        chunker = ClauseChunker()
        sequence_id = 0
        full_chat_tokens = []

        cfg = config_store.get()
        tts_engine = cfg.get("ttsEngine", "edge_tts")

        try:
            async for token in chat_client.stream_chat(user_prompt):
                full_chat_tokens.append(token)
                await connection_manager.send_json(session_id, {
                    "type": "chat_stream_chunk",
                    "token": token
                })
                if tts_engine == "edge_tts":
                    clauses = chunker.feed_token(token)
                    for clause in clauses:
                        try:
                            await synthesize_and_send_audio(session_id, clause, tts_adapter, sequence_id)
                            sequence_id += 1
                        except Exception as tts_err:
                            logger.warning(f"Streaming TTS error on clause: {tts_err}")

            if tts_engine == "edge_tts":
                final_clauses = chunker.flush()
                for clause in final_clauses:
                    try:
                        await synthesize_and_send_audio(session_id, clause, tts_adapter, sequence_id)
                        sequence_id += 1
                    except Exception as tts_err:
                        logger.warning(f"Final TTS clause error: {tts_err}")

        except Exception as chat_err:
            logger.warning(f"Chat stream encountered error ({chat_err}), using fallback speech.")

        complete_spoken_text = "".join(full_chat_tokens).strip()
        if not complete_spoken_text:
            complete_spoken_text = chat_client._get_fallback_speech(user_prompt)

        # Broadcast guaranteed complete spoken response to frontend for audio playback & visual sync
        await connection_manager.send_json(session_id, {
            "type": "chat_response",
            "text": complete_spoken_text,
            "role": "assistant"
        })

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

    # Immediately synchronize client with persisted disk configuration
    await connection_manager.send_json(session_id, {
        "type": "config_state",
        "config": config_store.get()
    })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type in ("speech_interim", "interim_transcript"):
                prewarmer.on_interim_text(session_id, data.get("text", ""))

            elif msg_type in ("speech_final", "final_transcript", "prompt_test", "prompt_request"):
                text = (data.get("text") or "").strip()
                if not text:
                    continue

                loop = asyncio.get_event_loop()
                now_ts = loop.time()
                last_txt = getattr(session, "last_prompt_text", None)
                last_time = getattr(session, "last_prompt_time", 0.0)

                # Deduplicate identical consecutive prompts within 2.0s
                if text == last_txt and (now_ts - last_time) < 2.0:
                    logger.info(f"[{session_id}] Duplicate prompt suppressed: '{text[:30]}'")
                    continue

                session.last_prompt_text = text
                session.last_prompt_time = now_ts

                if session.in_flight_task and not session.in_flight_task.done():
                    logger.info(f"[{session_id}] Canceling previous task for incoming prompt: '{text[:30]}'")
                    session.in_flight_task.cancel()

                session.in_flight_task = asyncio.create_task(
                    process_conversational_turn(session_id, text, default_tts, state_machine)
                )

            elif msg_type == "barge_in":
                # Only execute barge-in if the agent is actively SPEAKING!
                # If state is THINKING, the user prompt is still being processed by D3 or Chat LLM
                # and must NEVER be cancelled by ambient room noise or VAD flutter!
                if state_machine.current_state == TurnState.SPEAKING:
                    await barge_in_handler.handle_barge_in(session_id, state_machine, session.in_flight_task)
                else:
                    logger.info(f"[{session_id}] Ignored barge_in during state {state_machine.current_state.value}")

            elif msg_type in ("heartbeat", "ping"):
                ts = data.get("timestamp", data.get("timestamp_ms", 0))
                await connection_manager.send_json(session_id, {"type": "pong", "timestamp": ts})

            elif msg_type == "llm_config":
                # Persist updated configuration directly to PC disk
                saved_cfg = config_store.save({
                    "provider": data.get("provider", "openai"),
                    "baseUrl": data.get("base_url") or data.get("baseUrl") or "https://api.openai.com/v1",
                    "apiKey": data.get("api_key") if "api_key" in data else data.get("apiKey", ""),
                    "model": data.get("model", "gpt-4o-mini"),
                    "temperature": data.get("temperature", 0.7),
                    "systemPrompt": data.get("system_prompt") or data.get("systemPrompt"),
                    "decisionModel": data.get("decision_model") or data.get("decisionModel", "vllm-sr/d3-flash"),
                    "ttsEngine": data.get("tts_engine") or data.get("ttsEngine", "edge_tts"),
                    "ttsVoice": data.get("tts_voice") or data.get("ttsVoice", "en-US-ChristopherNeural"),
                    "ttsRate": data.get("tts_rate") or data.get("ttsRate", "+0%")
                })
                sync_runtime_config(saved_cfg)

                pool_stats = decision_key_pool.get_pool_stats()
                await connection_manager.send_json(session_id, {
                    "type": "config_ack",
                    "status": "updated",
                    "saved_to_disk": True,
                    "chat_model": chat_client.model,
                    "decision_model": decision_client.model,
                    "decision_key_pool": pool_stats,
                    "tts_voice": getattr(default_tts, "_voice", "default"),
                    "config": saved_cfg
                })

    except WebSocketDisconnect:
        connection_manager.disconnect(session_id)
        if session.in_flight_task and not session.in_flight_task.done():
            session.in_flight_task.cancel()
