"""
openai_chat_client.py
OpenAI-Compatible Conversational Chat LLM Integrator for Spoken Dialogue.
Specialized for speech synthesis: streams tokens into the ClauseChunker to synthesize
low-latency 24kHz audio via EdgeTTS, ElevenLabs, Cartesia, or Piper.
"""

import os
import json
import logging
import httpx
from typing import AsyncGenerator, List, Dict, Optional

logger = logging.getLogger("OpenAIChatClient")

DEFAULT_SYSTEM_PROMPT = (
    "You are XeroKratos, an ultra-advanced 3D Holographic AI Agent inside a physical Pepper's Ghost optical display. "
    "You communicate clearly, concisely, and naturally for real-time voice speech. "
    "Keep responses focused, sharp, and conversational without markdown fluff or bullet points."
)


class OpenAIChatClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        system_prompt: Optional[str] = None
    ):
        self.base_url = (base_url or os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")).rstrip("/")
        self.api_key = api_key or os.getenv("LLM_API_KEY", "")
        self.model = model or os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
        self.history: List[Dict[str, str]] = []

    def update_config(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> None:
        if base_url:
            self.base_url = base_url.rstrip("/")
        if api_key is not None:
            self.api_key = api_key
        if model:
            self.model = model
        if system_prompt:
            self.system_prompt = system_prompt
        logger.info(f"OpenAIChatClient config updated: model={self.model}, base_url={self.base_url}")

    async def stream_chat(
        self,
        user_message: str,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """
        Streams conversational tokens for spoken voice generation.
        Falls back to resilient spoken sentences if API key is mock or offline.
        """
        # Only skip external API call if using default official OpenAI URL without an API key
        is_default_openai_without_key = (
            "api.openai.com" in self.base_url and
            (not self.api_key or self.api_key in ("mock-key", "default-key", ""))
        )
        if is_default_openai_without_key:
            logger.info("OpenAIChatClient: No OpenAI API key provided for official endpoint. Using local conversational fallback.")
            fallback = self._get_fallback_speech(user_message)
            for word in fallback.split():
                yield word + " "
            return

        logger.info(f"OpenAIChatClient: streaming request to {self.base_url}/chat/completions (model={self.model})")

        payload_messages = [
            {"role": "system", "content": self.system_prompt},
            *self.history[-4:],
            {"role": "user", "content": user_message}
        ]

        payload = {
            "model": self.model,
            "messages": payload_messages,
            "temperature": temperature,
            "stream": True,
        }

        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        url = f"{self.base_url}/chat/completions"

        full_response = []
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        err_body = await response.aread()
                        err_msg = err_body.decode('utf-8', errors='ignore')[:300]
                        logger.error(f"Chat API HTTP {response.status_code} at {url} (model={self.model}): {err_msg}")
                        
                        # Try non-streaming fallback in case server does not support SSE
                        try:
                            logger.info(f"Attempting non-streaming fallback to {url}...")
                            non_stream_payload = {**payload, "stream": False}
                            res = await client.post(url, headers=headers, json=non_stream_payload, timeout=20.0)
                            if res.status_code == 200:
                                res_data = res.json()
                                reply = res_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                                if reply:
                                    logger.info(f"Non-streaming Chat response received ({len(reply)} chars)")
                                    self.history.append({"role": "user", "content": user_message})
                                    self.history.append({"role": "assistant", "content": reply})
                                    for word in reply.split():
                                        yield word + " "
                                    return
                        except Exception as non_stream_err:
                            logger.warning(f"Non-streaming fallback failed: {non_stream_err}")

                        fallback = self._get_fallback_speech(user_message)
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
                                    full_response.append(content)
                                    yield content
                            except json.JSONDecodeError:
                                continue

            # Update conversational history
            if full_response:
                complete_text = "".join(full_response)
                logger.info(f"Chat LLM stream completed ({len(complete_text)} chars).")
                self.history.append({"role": "user", "content": user_message})
                self.history.append({"role": "assistant", "content": complete_text})
                if len(self.history) > 10:
                    self.history = self.history[-10:]

        except Exception as e:
            logger.error(f"OpenAI Chat stream failed: {e}", exc_info=True)
            fallback = self._get_fallback_speech(user_message)
            for word in fallback.split():
                yield word + " "

    def _get_fallback_speech(self, user_text: str) -> str:
        """
        Concise, spoken conversational fallback lines when external chat API is offline.
        """
        text = user_text.lower()
        if "terminal" in text or "status" in text or "log" in text:
            return "Deploying holographic wrist terminal. System telemetry and stdout logs are active."
        if "worker" in text or "spawn" in text or "sub-agent" in text:
            return "Sub-agent worker node initialized. Allocating auxiliary task pipeline in holographic space."
        if "heal" in text or "fix" in text or "quantum" in text:
            return "Quantum heal initiated. Harmonizing holographic phase and resetting joint springs."
        if "calibrate" in text or "glass" in text or "optics" in text or "pepper" in text:
            return "The Pepper's Ghost optical stage operates at 45 degrees, projecting a zero-void 3D hologram directly above your screen."
        if "hello" in text or "hi" in text or "hey" in text:
            return "Greetings. I am XeroKratos, your 3D holographic agent. Ready for instructions."
        return f"Understood. The holographic harness is operational and standing by for further commands."
