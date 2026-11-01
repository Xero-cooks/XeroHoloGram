import pytest
from backend.app.llm.vllm_decision_client import VLLMDecisionClient
from backend.app.schemas.decision_schema import AgentIntentClass, AgentEmotion, HoloShaderState


@pytest.mark.anyio
async def test_vllm_response_parsing():
    client = VLLMDecisionClient()
    mock_response = {
        "answers": {
            "intent": {
                "type": "choice",
                "choice": "terminal",
                "probabilities": {
                    "terminal": 0.9912,
                    "worker": 0.002,
                    "heal": 0.001,
                    "calibrate": 0.001,
                    "optics": 0.002,
                    "greet": 0.001,
                    "chat": 0.0018
                },
                "confidence": 0.985
            },
            "emotion": {
                "type": "choice",
                "choice": "focused",
                "probabilities": {"focused": 0.94, "alert": 0.04, "resolute": 0.01, "attentive": 0.01},
                "confidence": 0.92
            },
            "needs_tool": {
                "type": "noul",
                "noul": 0.992
            },
            "urgency": {
                "type": "score",
                "score": 2.1,
                "confidence": 0.75
            }
        },
        "model": "vllm-sr/d3-flash",
        "usage": {"input_tokens": 195, "output_tokens": 0}
    }

    decision = client._parse_vllm_response(mock_response, "Show terminal logs")
    assert decision.intent_class == AgentIntentClass.SUMMON_TERMINAL
    assert decision.confidence == 0.985
    assert decision.tool_call is not None
    assert decision.tool_call.name == "summon_wrist_terminal"
    assert decision.holo_shader_state == HoloShaderState.MAGENTA_GLITCH
    assert len(decision.gesture_sequence) > 0


@pytest.mark.anyio
async def test_vllm_fallback_worker_spawner():
    client = VLLMDecisionClient()
    decision = await client.evaluate_decision("Spawn sub-agent worker node")

    assert decision.intent_class == AgentIntentClass.SPAWN_WORKER
    assert decision.tool_call is not None
    assert decision.tool_call.name == "spawn_subagent"
    assert decision.emotion == AgentEmotion.CYBERNETIC_ALERT


@pytest.mark.anyio
async def test_vllm_fallback_quantum_heal():
    client = VLLMDecisionClient()
    decision = await client.evaluate_decision("Quantum heal and reset SO(3) springs")

    assert decision.intent_class == AgentIntentClass.QUANTUM_HEAL
    assert decision.tool_call is not None
    assert decision.tool_call.name == "execute_quantum_heal"
    assert decision.holo_shader_state == HoloShaderState.EMERALD_HEALED
