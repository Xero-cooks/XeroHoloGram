from typing import AsyncGenerator
import edge_tts
from backend.app.tts.base_adapter import BaseTTSAdapter


class EdgeTTSAdapter(BaseTTSAdapter):
    def __init__(self, voice: str = "en-US-AriaNeural", rate: str = "+0%", pitch: str = "+0Hz"):
        self._voice = voice
        self._rate = rate
        self._pitch = pitch
        self._sample_rate = 24000

    @property
    def engine_name(self) -> str:
        return "Edge-TTS"

    @property
    def sample_rate(self) -> int:
        return self._sample_rate

    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        if not text.strip():
            return

        try:
            communicate = edge_tts.Communicate(text, self._voice, rate=self._rate, pitch=self._pitch)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except Exception:
            yield b"\x00" * 960
