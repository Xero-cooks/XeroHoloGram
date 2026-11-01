import logging
from typing import Dict, Optional

logger = logging.getLogger("SpeculativePrewarmer")


class SpeculativePrewarmer:
    def __init__(self):
        self.prewarm_cache: Dict[str, str] = {}

    def on_interim_text(self, session_id: str, interim_text: str):
        self.prewarm_cache[session_id] = interim_text
        # In a real model, this triggers KV cache pre-computation or embedding lookup
        logger.debug(f"[{session_id}] Pre-warming speculative context: '{interim_text[:40]}...'")

    def consume_prewarmed(self, session_id: str) -> Optional[str]:
        return self.prewarm_cache.pop(session_id, None)

    def clear(self, session_id: str):
        self.prewarm_cache.pop(session_id, None)
