from abc import ABC, abstractmethod
from typing import AsyncGenerator


class BaseTTSAdapter(ABC):
    @property
    @abstractmethod
    def engine_name(self) -> str:
        """Name of the TTS engine"""
        pass

    @property
    @abstractmethod
    def sample_rate(self) -> int:
        """Output audio sample rate in Hz (typically 24000)"""
        pass

    @abstractmethod
    async def synthesize_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        """Streams raw Int16 PCM audio bytes for the given text"""
        pass

    async def health_check(self) -> bool:
        """Verifies engine availability"""
        return True
