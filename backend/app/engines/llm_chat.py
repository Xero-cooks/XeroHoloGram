import re
from typing import AsyncGenerator, List, Dict
from backend.app.llm.llm_client import StreamingLLMClient


class ConversationalChatEngine:
    PUNCT_SPLIT = re.compile(r"([.!?,;:\n—]+)")

    def __init__(self, client: StreamingLLMClient):
        self.client = client

    async def stream_clauses(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        buffer = ""
        async for token in self.client.stream_chat(messages):
            buffer += token
            parts = self.PUNCT_SPLIT.split(buffer)

            # Check if we have at least one complete clause
            if len(parts) >= 3:
                # clause = text + delimiter
                clause = parts[0] + parts[1]
                word_count = len(clause.strip().split())
                if word_count >= 5 or parts[1] in {".", "!", "?", "\n"}:
                    yield clause.strip()
                    buffer = "".join(parts[2:])

        if buffer.strip():
            yield buffer.strip()
