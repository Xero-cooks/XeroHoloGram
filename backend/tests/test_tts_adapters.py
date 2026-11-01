import asyncio
from backend.app.tts.edge_adapter import EdgeTTSAdapter
from backend.app.tts.kokoro_adapter import KokoroTTSAdapter
from backend.app.tts.elevenlabs_adapter import ElevenLabsTTSAdapter
from backend.app.tts.cartesia_adapter import CartesiaTTSAdapter
from backend.app.tts.openai_adapter import OpenAITTSAdapter
from backend.app.tts.piper_adapter import PiperTTSAdapter


def test_tts_adapter_specifications():
    adapters = [
        (EdgeTTSAdapter(), "Edge-TTS", 24000),
        (KokoroTTSAdapter(), "Kokoro-82M", 24000),
        (ElevenLabsTTSAdapter(), "ElevenLabs", 24000),
        (CartesiaTTSAdapter(), "Cartesia Sonic", 24000),
        (OpenAITTSAdapter(), "OpenAI-TTS", 24000),
        (PiperTTSAdapter(), "Piper", 22050),
    ]

    for adapter, expected_name, expected_rate in adapters:
        assert adapter.engine_name == expected_name
        assert adapter.sample_rate == expected_rate


def test_tts_stream_generation():
    async def run_streams():
        adapters = [
            EdgeTTSAdapter(),
            KokoroTTSAdapter(),
            PiperTTSAdapter(),
        ]

        for adapter in adapters:
            chunks = []
            async for chunk in adapter.synthesize_stream("Test phrase"):
                chunks.append(chunk)
            assert len(chunks) > 0
            assert isinstance(chunks[0], bytes)

    asyncio.run(run_streams())
