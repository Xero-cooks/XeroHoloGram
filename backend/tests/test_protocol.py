import pytest
from backend.app.protocol.audio_packer import AudioPacker, HEADER_SIZE


def test_audio_packer_roundtrip():
    seq_id = 101
    sample_rate = 24000
    num_samples = 480
    flags = 1
    raw_pcm = b"\x00\x01\x02\x03" * 240  # 960 bytes

    packed = AudioPacker.pack_audio_frame(seq_id, sample_rate, num_samples, flags, raw_pcm)
    assert len(packed) == HEADER_SIZE + len(raw_pcm)

    out_seq, out_rate, out_samples, out_flags, out_pcm = AudioPacker.unpack_audio_frame(packed)
    assert out_seq == seq_id
    assert out_rate == sample_rate
    assert out_samples == num_samples
    assert out_flags == flags
    assert out_pcm == raw_pcm


def test_audio_packer_truncated_packet_rejection():
    short_data = b"\x01\x02\x03"
    with pytest.raises(ValueError, match="Packet smaller than header size"):
        AudioPacker.unpack_audio_frame(short_data)
