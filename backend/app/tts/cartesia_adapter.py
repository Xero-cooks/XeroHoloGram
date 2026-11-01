import os
import httpx
from typing import AsyncGenerator
from backend.app.tts.base_adapter import BaseTTSAdapter


class CartesiaTTSAdapter(BaseTTSAdapter):
    def __init__(self, api_key: str = "", voice_id: str = "a0e99841-438c-4a64-b679-ae501e7d6091"):
        self._api_key = api_key or os.getenv("CARTESIA_API_KEY", "")
        self._voice_id = voice_id
        self._sample_rate = 24000

    @property
    def engine_name(self) -> str:
        return "Cartesia Sonic"

    @property
    def sample_rate(self) -> int:
        return self._sample_rate

    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        if not text.strip():
            return

        url = "https://api.cartesia.ai/tts/bytes"
        headers = {
            "X-API-Key": self._api_key,
            "Cartesia-Version": "2024-06-10",
            "Content-Type": "application/json"
        }
        payload = {
            "model_id": "sonic-english",
            "transcript": text,
            "voice": {"mode": "id", "id": self._voice_id},
            "output_format": {"container": "raw", "encoding": "pcm_s16le", "sample_rate": 24000}
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code == 200:
                        async for chunk in response.aiter_bytes(chunk_size=1920):
                            yield chunk
                    else:
                        yield b"\x00" * 960
        except Exception:
            yield b"\x00" * 960
