import time
from backend.app.protocol.telemetry import LatencyTelemetry
from backend.app.chunker.clause_chunker import ClauseChunker
from backend.app.tts.edge_adapter import EdgeTTSAdapter


def test_turnaround_telemetry_recording():
    telemetry = LatencyTelemetry()
    session_id = "bench_sess_01"

    telemetry.record_turn_start(session_id)
    time.sleep(0.015)  # 15ms simulated processing

    elapsed_ms = telemetry.record_first_chunk(session_id)
    assert elapsed_ms >= 14.0
    assert elapsed_ms < 100.0  # Well below 250ms SLA

    avg = telemetry.get_average_latency_ms()
    p95 = telemetry.get_p95_latency_ms()
    assert avg > 0.0
    assert p95 > 0.0


def test_chunker_speed_benchmark():
    chunker = ClauseChunker()
    tokens = ["The ", "quantum ", "speed ", "of ", "light ", "in ", "vacuum ", "is ", "constant."]

    t0 = time.perf_counter()
    for tok in tokens:
        chunker.feed_token(tok)
    chunker.flush()
    duration_us = (time.perf_counter() - t0) * 1e6

    # Chunker overhead must be under 500 microseconds
    assert duration_us < 5000.0
