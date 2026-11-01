import struct
from typing import Tuple

# Header format: 4 x uint32 (little endian) = 16 bytes
HEADER_FORMAT = "<IIII"
HEADER_SIZE = struct.calcsize(HEADER_FORMAT)


class AudioPacker:
    @staticmethod
    def pack_audio_frame(
        sequence_id: int,
        sample_rate: int,
        num_samples: int,
        flags: int,
        pcm_bytes: bytes
    ) -> bytes:
        header = struct.pack(HEADER_FORMAT, sequence_id, sample_rate, num_samples, flags)
        return header + pcm_bytes

    @staticmethod
    def unpack_audio_frame(data: bytes) -> Tuple[int, int, int, int, bytes]:
        if len(data) < HEADER_SIZE:
            raise ValueError(f"Packet smaller than header size ({len(data)} < {HEADER_SIZE})")

        sequence_id, sample_rate, num_samples, flags = struct.unpack_from(HEADER_FORMAT, data, 0)
        pcm_bytes = data[HEADER_SIZE:]
        return sequence_id, sample_rate, num_samples, flags, pcm_bytes
