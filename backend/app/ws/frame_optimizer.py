from typing import Generator


class FrameOptimizer:
    @staticmethod
    def chunk_pcm_stream(
        pcm_bytes: bytes,
        sample_rate: int = 24000,
        bytes_per_sample: int = 2,  # Int16
        chunk_duration_ms: int = 30
    ) -> Generator[bytes, None, None]:
        # Bytes per chunk = (sample_rate * (chunk_duration_ms / 1000)) * bytes_per_sample
        samples_per_chunk = int(sample_rate * (chunk_duration_ms / 1000.0))
        chunk_size = samples_per_chunk * bytes_per_sample

        for i in range(0, len(pcm_bytes), chunk_size):
            yield pcm_bytes[i : i + chunk_size]
