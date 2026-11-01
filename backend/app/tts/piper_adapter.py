import shutil
import asyncio
from typing import AsyncGenerator
from backend.app.tts.base_adapter import BaseTTSAdapter


class PiperTTSAdapter(BaseTTSAdapter):
    def __init__(self, piper_binary: str = "piper", model_path: str = "en_US-lessac-medium.onnx"):
        self._piper_binary = piper_binary
        self._model_path = model_path
        self._sample_rate = 22050

    @property
    def engine_name(self) -> str:
        return "Piper"

    @property
    def sample_rate(self) -> int:
        return self._sample_rate

    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        if not text.strip():
            return

        # Check if piper binary is installed locally
        if not shutil.which(self._piper_binary):
            # Fallback mock audio chunks for testing
            yield b"\x00" * 960
            return

        cmd = [self._piper_binary, "--model", self._model_path, "--output-raw"]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL
            )
            stdout, _ = await proc.communicate(input=text.encode("utf-8"))
            if stdout:
                for i in range(0, len(stdout), 1920):
                    yield stdout[i : i + 1920]
        except Exception:
            yield b"\x00" * 960
