import os
import httpx
from typing import AsyncGenerator
from backend.app.tts.base_adapter import BaseTTSAdapter


class OpenAITTSAdapter(BaseTTSAdapter):
    def __init__(self, api_key: str = "", voice: str = "nova", model: str = "tts-1"):
        self._api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self._voice = voice
        self._model = model
        self._sample_rate = 24000

    @property
    def engine_name(self) -> str:
        return "OpenAI-TTS"

    @property
    def sample_rate(self) -> int:
        return self._sample_rate

    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        if not text.strip():
            return

        url = "https://api.openai.com/v1/audio/speech"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self._model,
            "input": text,
            "voice": self._voice,
            "response_format": "pcm"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code == 200:
                        async for chunk in response.aiter_bytes(chunk_size=1920):
                            yield chunk
                    else:
                        yield b"\x00" * 960
        except Exception:
            yield b"\x00" * 960
