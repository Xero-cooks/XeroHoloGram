# Audio Streaming & Viseme Lip-Sync Synthesis

## 1. Dual-Mode Lip-Sync Architecture
`XeroHoloGram` incorporates a dual-mode lip-sync synthesizer designed for physical holographic staging:

```
                  +--------------------------------+
                  |  Inbound WebSocket Audio Stream|
                  +---------------+----------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
  [Mode 1: Real-Time FFT]                    [Mode 2: Timestamp Lip-Sync]
  - 512-point FFT bins                       - TTS Word & Phoneme timestamps
  - Formant Extraction (F1, F2, F3)          - Hermite coarticulation curve
  - Asymmetric Attack/Decay Envelope         - Direct viseme activation
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
                    [Hybrid Crossfade Blending]
                                  |
                                  v
              +---------------------------------------+
              | 15 Canonical Preston Blair / Oculus   |
              | Viseme Blendshapes (viseme_sil...ou)  |
              +-------------------+-------------------+
                                  |
                +-----------------+-----------------+
                | (If model has blendshapes)        | (Fallback)
                v                                   v
      [SkinnedMesh Morph Targets]         [Jaw Bone Pitch Rotation]
```

---

## 2. Spectral Formants to Visemes
Human vowel articulation alters the resonant cavities of the vocal tract, producing characteristic spectral peaks:
- **Formant 1 ($F_1: 150 - 800\text{ Hz}$)**: Corresponds to pharyngeal cavity volume and jaw openness. High $F_1$ energy activates `viseme_aa` and `viseme_oh`.
- **Formant 2 ($F_2: 800 - 2200\text{ Hz}$)**: Corresponds to oral cavity length and tongue fronting. High $F_2$ energy activates `viseme_E` and `viseme_ih`.
- **Formant 3 ($F_3: 2200 - 4500\text{ Hz}$)**: Associated with turbulent airflow across teeth and alveolar ridge. High $F_3$ energy activates fricatives (`viseme_SS`, `viseme_FF`, `viseme_CH`).

### Asymmetric Envelope Follower
$$\tau_{\text{attack}} = 10\text{ms}, \quad \tau_{\text{decay}} = 45\text{ms}$$
Ensures mouth opens instantly on speech onset and closes naturally without fluttering or chattering.

---

## 3. Audio Jitter Buffer & Barge-In Purge
- **Target Cushion**: $60\text{ms}$ buffer duration prevents underrun clicks on network jitter.
- **Instant Flush**: Upon barge-in detection, `buffer.flush()` empties all queued PCM chunks in $< 1\text{ms}$, muting playback immediately.
