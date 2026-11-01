import pytest
from backend.app.schemas.decision_schema import (
    AgenticDecisionPacket,
    AgentIntentClass,
    AgentEmotion,
    HoloShaderState,
    DecisionPolicyState,
)
from backend.app.llm.decision_llm import DecisionLLMEngine


@pytest.mark.anyio
async def test_decision_llm_fallback_terminal_summon():
    engine = DecisionLLMEngine(api_key="")
    decision = await engine.evaluate_decision("Please open the holographic wrist terminal and show logs")

    assert isinstance(decision, AgenticDecisionPacket)
    assert decision.intent_class == AgentIntentClass.SUMMON_TERMINAL
    assert decision.confidence >= 0.95
    assert decision.tool_call is not None
    assert decision.tool_call.name == "summon_wrist_terminal"
    assert decision.holo_shader_state == HoloShaderState.MAGENTA_GLITCH
    assert len(decision.gesture_sequence) > 0
    assert decision.gesture_sequence[0].base_preset == "terminal_summon"


@pytest.mark.anyio
async def test_decision_llm_fallback_spawn_worker():
    engine = DecisionLLMEngine(api_key="")
    decision = await engine.evaluate_decision("Can you spawn a sub-agent worker to process data?")

    assert decision.intent_class == AgentIntentClass.SPAWN_WORKER
    assert decision.tool_call is not None
    assert decision.tool_call.name == "spawn_subagent"
    assert decision.emotion == AgentEmotion.CYBERNETIC_ALERT


@pytest.mark.anyio
async def test_decision_llm_fallback_quantum_heal():
    engine = DecisionLLMEngine(api_key="")
    decision = await engine.evaluate_decision("Trigger quantum heal and fix joints")

    assert decision.intent_class == AgentIntentClass.QUANTUM_HEAL
    assert decision.holo_shader_state == HoloShaderState.EMERALD_HEALED
    assert decision.tool_call is not None
    assert decision.tool_call.name == "execute_quantum_heal"


@pytest.mark.anyio
async def test_decision_llm_fallback_optics_calibrate():
    engine = DecisionLLMEngine(api_key="")
    decision = await engine.evaluate_decision("Calibrate optical reflector glass angle and pythagoras")

    assert decision.intent_class == AgentIntentClass.CALIBRATE_STAGE
    assert decision.tool_call is not None
    assert decision.tool_call.name == "calibrate_stage"
    assert "glass_angle_deg" in decision.tool_call.parameters


@pytest.mark.anyio
async def test_decision_llm_fallback_greeting():
    engine = DecisionLLMEngine(api_key="")
    decision = await engine.evaluate_decision("Hello XeroKratos!")

    assert decision.intent_class == AgentIntentClass.GREET_ACKNOWLEDGE
    assert decision.confidence > 0.9
    assert "XeroKratos" in decision.speech_response
