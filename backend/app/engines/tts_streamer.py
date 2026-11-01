import time
from typing import AsyncGenerator, Dict, List, Tuple
from backend.app.tts.base_adapter import BaseTTSAdapter
from backend.app.tts.edge_adapter import EdgeTTSAdapter
from backend.app.tts.kokoro_adapter import KokoroTTSAdapter
from backend.app.tts.elevenlabs_adapter import ElevenLabsTTSAdapter


class TTSStreamer:
    def __init__(self, default_adapter: BaseTTSAdapter = None):
        self.adapter = default_adapter or EdgeTTSAdapter()
        self.adapters: Dict[str, BaseTTSAdapter] = {
            "Edge-TTS": self.adapter,
            "Kokoro-82M": KokoroTTSAdapter(),
            "ElevenLabs": ElevenLabsTTSAdapter(),
        }

    def select_adapter(self, name: str):
        if name in self.adapters:
            self.adapter = self.adapters[name]

    @property
    def sample_rate(self) -> int:
        return self.adapter.sample_rate

    async def stream_audio_with_timestamps(
        self, clause: str
    ) -> AsyncGenerator[Tuple[bytes, List[Dict[str, any]]], None]:
        words = clause.strip().split()
        estimated_duration_sec = max(len(words) * 0.35, 0.4)

        # Generate estimated word boundary timestamps
        timestamps = []
        curr_time = 0.0
        step = estimated_duration_sec / max(len(words), 1)

        for w in words:
            timestamps.append({
                "word": w,
                "start_ms": int(curr_time * 1000),
                "end_ms": int((curr_time + step) * 1000)
            })
            curr_time += step

        async for chunk in self.adapter.synthesize_stream(clause):
            yield chunk, timestamps
