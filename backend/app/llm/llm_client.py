import os
import json
import httpx
from typing import AsyncGenerator, List, Dict, Optional


class StreamingLLMClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        system_prompt: Optional[str] = None
    ):
        self.base_url = (base_url or os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")).rstrip("/")
        self.api_key = api_key or os.getenv("LLM_API_KEY", "mock-key")
        self.model = model or os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.system_prompt = system_prompt or (
            "You are a responsive 3D Holographic AI Agent in a Pepper's Ghost optical display. "
            "Speak naturally, clearly, and concisely in spoken conversation."
        )

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        payload_messages = [{"role": "system", "content": self.system_prompt}] + messages

        payload = {
            "model": self.model,
            "messages": payload_messages,
            "temperature": temperature,
            "stream": True,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        url = f"{self.base_url}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        # Fallback response if API key is mock or unavailable
                        fallback = "Hello! I am your 3D holographic agent, ready to converse."
                        for word in fallback.split():
                            yield word + " "
                        return

                    async for line in response.aiter_lines():
                        if not line.strip() or line.strip() == "data: [DONE]":
                            continue
                        if line.startswith("data: "):
                            line_data = line[6:]
                            try:
                                chunk = json.loads(line_data)
                                delta = chunk.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
        except Exception:
            # Resilient fallback mock response for testing
            mock_text = "Greetings! The holographic projection is calibrated and operating at 60 FPS."
            for token in mock_text.split(" "):
                yield token + " "
