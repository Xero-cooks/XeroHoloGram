"""
config_store.py
Persistent storage of LLM, Decision, and TTS configuration on local PC disk.
Reads and writes directly to <PROJECT_ROOT>/config/llm_config.json
"""

import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("ConfigStore")

# Compute Project Root
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
CONFIG_DIR = os.path.join(PROJECT_ROOT, "config")
CONFIG_FILE = os.path.join(CONFIG_DIR, "llm_config.json")

DEFAULT_CONFIG: Dict[str, Any] = {
    "provider": "openai",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "systemPrompt": (
        "You are XeroKratos, an ultra-advanced 3D Holographic AI Agent inside a physical Pepper's Ghost optical display. "
        "You communicate clearly, concisely, and naturally for real-time voice speech. "
        "Keep responses focused, sharp, and conversational without markdown fluff or bullet points."
    ),
    "decisionModel": "vllm-sr/d3-flash",
    "ttsEngine": "edge_tts",
    "ttsVoice": "en-US-ChristopherNeural",
    "ttsRate": "+0%"
}


class ConfigStore:
    def __init__(self, file_path: str = CONFIG_FILE):
        self.file_path = file_path
        self._ensure_dir()
        self.config: Dict[str, Any] = DEFAULT_CONFIG.copy()
        self.config = self.load()

    def _ensure_dir(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)

    def load(self) -> Dict[str, Any]:
        """Loads configuration from local disk JSON file, merging with defaults."""
        self._ensure_dir()
        if not os.path.exists(self.file_path):
            self.save(DEFAULT_CONFIG)
            return DEFAULT_CONFIG.copy()

        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                merged = {**DEFAULT_CONFIG, **loaded}
                logger.info(f"Loaded LLM & model config from {self.file_path}")
                return merged
        except Exception as e:
            logger.warning(f"Failed to read {self.file_path} ({e}), using default config.")
            return DEFAULT_CONFIG.copy()

    def save(self, new_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atomically persists updated configuration to local PC disk file."""
        self._ensure_dir()
        merged = {**self.config, **new_data}
        tmp_file = f"{self.file_path}.tmp"
        try:
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(merged, f, indent=2, ensure_ascii=False)
            os.replace(tmp_file, self.file_path)
            self.config = merged
            logger.info(f"Successfully persisted configuration to {self.file_path}")
            return self.config
        except Exception as e:
            logger.error(f"Failed to save configuration to {self.file_path}: {e}")
            if os.path.exists(tmp_file):
                try:
                    os.remove(tmp_file)
                except Exception:
                    pass
            return self.config

    def get(self) -> Dict[str, Any]:
        return self.config.copy()


# Global Singleton
config_store = ConfigStore()
