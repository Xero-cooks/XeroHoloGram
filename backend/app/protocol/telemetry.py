import time
from typing import Dict, List


class LatencyTelemetry:
    def __init__(self):
        self.speech_start_times: Dict[str, float] = {}
        self.latencies_ms: List[float] = []

    def record_turn_start(self, session_id: str):
        self.speech_start_times[session_id] = time.perf_counter()

    def record_first_chunk(self, session_id: str) -> float:
        start = self.speech_start_times.pop(session_id, None)
        if start is not None:
            latency_ms = (time.perf_counter() - start) * 1000.0
            self.latencies_ms.append(latency_ms)
            return latency_ms
        return 0.0

    def get_average_latency_ms(self) -> float:
        if not self.latencies_ms:
            return 0.0
        return sum(self.latencies_ms) / len(self.latencies_ms)

    def get_p95_latency_ms(self) -> float:
        if not self.latencies_ms:
            return 0.0
        sorted_latencies = sorted(self.latencies_ms)
        idx = int(len(sorted_latencies) * 0.95)
        return sorted_latencies[min(idx, len(sorted_latencies) - 1)]
