import httpx
from typing import AsyncGenerator
from backend.app.tts.base_adapter import BaseTTSAdapter


class KokoroTTSAdapter(BaseTTSAdapter):
    def __init__(self, endpoint_url: str = "http://localhost:8880/v1/audio/speech", voice: str = "af_bella"):
        self._endpoint_url = endpoint_url
        self._voice = voice
        self._sample_rate = 24000

    @property
    def engine_name(self) -> str:
        return "Kokoro-82M"

    @property
    def sample_rate(self) -> int:
        return self._sample_rate

    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        if not text.strip():
            return

        payload = {
            "model": "kokoro",
            "input": text,
            "voice": self._voice,
            "response_format": "pcm"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                async with client.stream("POST", self._endpoint_url, json=payload) as response:
                    if response.status_code == 200:
                        async for chunk in response.aiter_bytes(chunk_size=1920):
                            yield chunk
                    else:
                        # Fallback simulated audio for local dev without Kokoro daemon
                        yield b"\x00" * 960
        except Exception:
            yield b"\x00" * 960
