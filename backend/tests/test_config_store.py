"""
test_config_store.py
Unit tests for persistent PC disk configuration storage.
"""

import os
import json
import tempfile
import pytest
from backend.app.config_store import ConfigStore


def test_config_store_roundtrip():
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_file = os.path.join(tmp_dir, "test_llm_config.json")
        store = ConfigStore(file_path=tmp_file)

        initial = store.get()
        assert initial["model"] == "gpt-4o-mini"
        assert os.path.exists(tmp_file)

        # Update and save to disk
        updated = store.save({
            "model": "claude-3-5-sonnet",
            "provider": "openrouter",
            "apiKey": "sk-or-test-key",
            "ttsVoice": "en-GB-RyanNeural"
        })

        assert updated["model"] == "claude-3-5-sonnet"
        assert updated["provider"] == "openrouter"
        assert updated["apiKey"] == "sk-or-test-key"
        assert updated["ttsVoice"] == "en-GB-RyanNeural"

        # Verify disk file content
        with open(tmp_file, "r", encoding="utf-8") as f:
            disk_data = json.load(f)
            assert disk_data["model"] == "claude-3-5-sonnet"
            assert disk_data["apiKey"] == "sk-or-test-key"

        # Verify re-instantiation reads the persisted file
        store2 = ConfigStore(file_path=tmp_file)
        assert store2.get()["model"] == "claude-3-5-sonnet"
        assert store2.get()["ttsVoice"] == "en-GB-RyanNeural"
