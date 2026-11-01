import os
import json
import httpx
from typing import AsyncGenerator
from backend.app.tts.base_adapter import BaseTTSAdapter


class ElevenLabsTTSAdapter(BaseTTSAdapter):
    def __init__(self, api_key: str = "", voice_id: str = "21m00Tcm4TlvDq8ikWAM", model_id: str = "eleven_turbo_v2"):
        self._api_key = api_key or os.getenv("ELEVENLABS_API_KEY", "")
        self._voice_id = voice_id
        self._model_id = model_id
        self._sample_rate = 24000

    @property
    def engine_name(self) -> str:
        return "ElevenLabs"

    @property
    def sample_rate(self) -> int:
        return self._sample_rate

    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        if not text.strip():
            return

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self._voice_id}/stream"
        headers = {
            "Accept": "audio/mpeg",
            "xi-api-key": self._api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": self._model_id,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}
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
