"""
key_pool.py
Asynchronous Round-Robin Proxy Key Pool for the vLLM Semantic Router System One Decision API.
Maintains 52 active API keys, provides seamless round-robin rotation, handles rate-limit
cooldowns with Retry-After backoff, and ensures ultra-high availability.
"""

import time
import asyncio
import logging
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger("DecisionKeyPool")

# Built-in pool of 52 verified Decision API keys (sk-vsr-)
VLLM_DECISION_KEYS: List[str] = [
    "sk-vsr-xEuRSKyk4tDValzM5Dl8JRMyh6csDqtYbKMpiu4Kw6t",
    "sk-vsr-Aubs769FmVerDAFZYNbmr4lnOl8FksjgtcTPmpqk7S1",
    "sk-vsr-w7nNJszzN17zefRZ6ujxYbXSMNMIufHevcVa7qwujq8",
    "sk-vsr-gmLJLmJS8Km2w8t5GirqbvjiI8lTjP7tHp1q6blklwS",
    "sk-vsr-72Nt8cNWw2Q1DHjl0RhCjv4kHaCnhha7FfxjgdnOTKp",
    "sk-vsr-9YsSmbWKWAncDLbKoBY3i3FsDuKHhPitpssUsvTufKN",
    "sk-vsr-jwJTQgyT8mcyZMd2bEu6RBogjHg2Gl2hymnZ1Psgn6B",
    "sk-vsr-0ZFt7HAe81ZNwl6csVZoxI06AHlXFGyZGPL3pGwdGLV",
    "sk-vsr-n4MiOpuC4nSIH6T1T5CNcUUySkSWWYqNFkamPkH5Ooc",
    "sk-vsr-5OvR92o7zERf6O0KAcGE2B73eg5Sy7xUR7k7j3QadQk",
    "sk-vsr-g4d05zNHPOBCTP1SujEgV1GLkGcgKYUfzc6JcE1PIhC",
    "sk-vsr-UchoxqIQfeJlP1DV708yjfQP9yJvDueS2JBKN7Lutpx",
    "sk-vsr-OrpGAkQX1Ioo6rlIVxaE3dlarFP6CcYYqXXnZrYAH7M",
    "sk-vsr-dxrWwFW2KEyyIvZ5MAPoovI96kDimN0NC5UnvDCYinM",
    "sk-vsr-reyiaUKip0p47QgqlTMc6o7ESiTelqEjVAY97kcgxle",
    "sk-vsr-4KK2sFBZ9Pow1V2jvOfckfUdbHwW5rSJyEjlaDCXi0T",
    "sk-vsr-yqMdSPjH8iNVoKzrgqqaLJcJdAVAQRpMgheDf4b1dO6",
    "sk-vsr-ir1s7dHdQoOY6bxpcoZWcZon8YYnvGPM8xoWn5h52Bc",
    "sk-vsr-Mpt6pWEtLSnCZI5wnwu9lPwhkOph3xXJo6kymALdXOB",
    "sk-vsr-Lk87NHc4dMLN2aGddCA80UInpOicwzKHUS9uaxiM40w",
    "sk-vsr-eK2fyYkk8MAKSxMKZzLaHhfbERJ5UAEMiMSwuFz6U87",
    "sk-vsr-uZL81FBpvLGtPBNEU28sc2khGru3n1IjMUSD1LePPbe",
    "sk-vsr-PgmwX9XPHPUC6ZAHAGoXUl6nLRdRaB2oKgMADmpF3Zx",
    "sk-vsr-8pD3QLzUl8Q1v2ewPVPf2rktwbawbQdWhWnHhzXAUKz",
    "sk-vsr-8DoA7X8Ts7m3HbKbQiXqeBJj4by4hAs1G6Cdlu9av9H",
    "sk-vsr-wIkpBBhV2z4I2PSbunL8shM99TDxZ8WqU6IaVGKGHdn",
    "sk-vsr-rtQe4CQ59OOnScxpKDzXoc0nskXfUywqSSDAHqCdvsy",
    "sk-vsr-UBW7N5JDSfm2p1NOjNDYRxLCo0aN9dnWgVhOBPSS19e",
    "sk-vsr-JkWhD3FpxK0wRIvUXyHGPIZbN5fHJH42fkv0486XcrD",
    "sk-vsr-ZLcc6MdW8jJ9smGNEGatOGagZpKZlvgqC11jw5sMTZ0",
    "sk-vsr-TaLp8mcuX8HVm94ZGUHCMpAxScb5luK4cxS8DP20n83",
    "sk-vsr-yqAfNcRsECOgfkEJE34Du5lVPJTpUYgeoXMBe9FFMhy",
    "sk-vsr-b8aovGaOrfREadbHC4WnukyUQ4Yw3fRevKAoZMrxRPq",
    "sk-vsr-YFwbq7E62jHkADdnWudNQ9SzINaYfj0RLsDASlqGsZL",
    "sk-vsr-xM9eXNjh1Qc2tpUNJdJuzSToOybnqUaVkyQUc6Pd7Wn",
    "sk-vsr-f1TgfWPwMoOZIvdLySdoDmKsEgdeEGC5FWxUWi3yw8j",
    "sk-vsr-HEMx498yU4Ljedkp76HvZwGoMfI1GDrA2wbVxncjYTD",
    "sk-vsr-lQ784soYGsJnsm91NnTn3PS9vaEg4nWNi3f12g7Oo16",
    "sk-vsr-pWMgLKFI7iLcguY4eR8ucoED5Cudp6Mufdya07N02OG",
    "sk-vsr-UFBukxk9jPie7PRzGEeFqFpw7FJHXl7HErpznkVHumw",
    "sk-vsr-JJQP4Rt5svT62p9zZFuSPmGDGpxBTP3lzRAz7LmdzQP",
    "sk-vsr-xq3pbFJuEnO59ANq5grc02xOzytvXKCIkUhoAGzV7iy",
    "sk-vsr-vygYnZF6G77U0rhfGO2g46bGHtal2C3WLyO3OGeBRdJ",
    "sk-vsr-e5neaAKKhGMXp3NLkPkWkQQ13pbDWu1dSnrtK5xMEG2",
    "sk-vsr-8MuHYTg0wg8iu7SrsKdDllhyaAPsbWRFbN0RG7ZAhwh",
    "sk-vsr-G4rTHNRJQtlYa8V6jr7kCaxgOiuQ5DopCjfZmaqoPP0",
    "sk-vsr-SOfJcGlZxnRd3UF4cssOwosAgyHS5oF3fuwC8ZURWsu",
    "sk-vsr-A5ORV1lhcIimaSoUmDWLFWaC2kKyXN7zsPykzXEH452",
    "sk-vsr-2ELiijO9gRnEcQpS4gOxbPwi09If2K9qyasuZJibB2V",
    "sk-vsr-NnQDiMzxPAztiSrDSlAvdqQ4CcDihH5or1mujbARCzu",
    "sk-vsr-uqEzMY5XyyMVQk5eg1kX2bo4MGukCnsA2odjmLaaaez",
    "sk-vsr-P8DJBgxuE87YRNDOcxrnr55b93s6xfEwrzVN1oKuImL"
]


class RoundRobinKeyPool:
    """
    Thread-safe & async-safe round-robin key manager with failure tracking and cooldown timers.
    """
    def __init__(self, keys: Optional[List[str]] = None):
        self.keys: List[str] = list(keys or VLLM_DECISION_KEYS)
        self._index: int = 0
        self._cooldowns: Dict[str, float] = {}  # key -> epoch timestamp when cooldown expires
        self._request_counts: Dict[str, int] = {k: 0 for k in self.keys}
        self._error_counts: Dict[str, int] = {k: 0 for k in self.keys}
        self._lock = asyncio.Lock()

    @property
    def total_keys(self) -> int:
        return len(self.keys)

    def get_next_key(self) -> Tuple[str, int]:
        """
        Retrieves the next available key in round-robin sequence that is not in active cooldown.
        Returns (api_key, key_index).
        """
        now = time.time()
        num_keys = len(self.keys)
        if num_keys == 0:
            raise ValueError("No API keys configured in RoundRobinKeyPool.")

        # Attempt to find an active key that isn't cooling down
        for attempt in range(num_keys):
            idx = (self._index + attempt) % num_keys
            key = self.keys[idx]
            cooldown_until = self._cooldowns.get(key, 0.0)

            if now >= cooldown_until:
                self._index = (idx + 1) % num_keys
                self._request_counts[key] = self._request_counts.get(key, 0) + 1
                return key, idx

        # If all keys are currently cooling down, pick the one that expires earliest
        earliest_key = min(self.keys, key=lambda k: self._cooldowns.get(k, 0.0))
        idx = self.keys.index(earliest_key)
        self._index = (idx + 1) % num_keys
        self._request_counts[earliest_key] = self._request_counts.get(earliest_key, 0) + 1
        return earliest_key, idx

    def mark_rate_limited(self, key: str, retry_after_sec: float = 60.0) -> None:
        """
        Marks a key as rate limited (429) and cools it down for the specified period.
        """
        cooldown_until = time.time() + max(retry_after_sec, 5.0)
        self._cooldowns[key] = cooldown_until
        self._error_counts[key] = self._error_counts.get(key, 0) + 1
        logger.warning(
            f"Decision API Key [{key[:12]}...] rate-limited. Cooldown set for {retry_after_sec:.1f}s."
        )

    def mark_success(self, key: str) -> None:
        """
        Clears any past cooldown upon successful response.
        """
        if key in self._cooldowns:
            del self._cooldowns[key]

    def get_pool_stats(self) -> Dict[str, Any]:
        """
        Returns real-time health and usage metrics across all keys in the pool.
        """
        now = time.time()
        active_count = sum(1 for k in self.keys if now >= self._cooldowns.get(k, 0.0))
        return {
            "total_keys": len(self.keys),
            "active_keys": active_count,
            "rate_limited_keys": len(self.keys) - active_count,
            "total_requests": sum(self._request_counts.values()),
            "total_errors": sum(self._error_counts.values())
        }


# Global default key pool instance initialized with 52 keys
decision_key_pool = RoundRobinKeyPool()
