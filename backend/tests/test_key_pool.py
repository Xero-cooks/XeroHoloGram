import pytest
import time
from backend.app.llm.key_pool import RoundRobinKeyPool, VLLM_DECISION_KEYS


def test_key_pool_initialization():
    pool = RoundRobinKeyPool()
    assert pool.total_keys == 52
    assert len(pool.keys) == 52
    assert pool.keys[0].startswith("sk-vsr-")


def test_key_pool_round_robin_rotation():
    pool = RoundRobinKeyPool(keys=["sk-vsr-key1", "sk-vsr-key2", "sk-vsr-key3"])
    k1, i1 = pool.get_next_key()
    k2, i2 = pool.get_next_key()
    k3, i3 = pool.get_next_key()
    k4, i4 = pool.get_next_key()

    assert k1 == "sk-vsr-key1" and i1 == 0
    assert k2 == "sk-vsr-key2" and i2 == 1
    assert k3 == "sk-vsr-key3" and i3 == 2
    assert k4 == "sk-vsr-key1" and i4 == 0


def test_key_pool_rate_limit_cooldown():
    pool = RoundRobinKeyPool(keys=["sk-vsr-key1", "sk-vsr-key2", "sk-vsr-key3"])
    pool.mark_rate_limited("sk-vsr-key1", retry_after_sec=10.0)

    # Next key should skip key1 and pick key2
    key, idx = pool.get_next_key()
    assert key == "sk-vsr-key2"
    assert idx == 1

    stats = pool.get_pool_stats()
    assert stats["total_keys"] == 3
    assert stats["active_keys"] == 2
    assert stats["rate_limited_keys"] == 1
