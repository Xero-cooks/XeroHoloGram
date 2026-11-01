import re
from typing import Tuple

POSITIVE_WORDS = {"great", "good", "happy", "excellent", "love", "wonderful", "amazing", "yes", "sure", "definitely"}
NEGATIVE_WORDS = {"bad", "sad", "unfortunate", "error", "sorry", "cannot", "no", "problem", "difficult"}
EXCITEMENT_REGEX = re.compile(r"[!]+")


class EmotionDetector:
    @staticmethod
    def analyze_text(text: str) -> Tuple[float, float]:
        """
        Returns (valence, arousal) tuple.
        Valence: -1.0 (negative) to +1.0 (positive)
        Arousal: 0.0 (calm) to +1.0 (excited/energetic)
        """
        words = set(re.findall(r"\b\w+\b", text.lower()))
        pos_matches = len(words.intersection(POSITIVE_WORDS))
        neg_matches = len(words.intersection(NEGATIVE_WORDS))

        valence = 0.0
        if pos_matches > neg_matches:
            valence = min(0.3 + 0.2 * pos_matches, 1.0)
        elif neg_matches > pos_matches:
            valence = max(-0.3 - 0.2 * neg_matches, -1.0)

        # Arousal driven by exclamation marks and emotional intensity
        exclamations = len(EXCITEMENT_REGEX.findall(text))
        arousal = min(0.2 + (pos_matches + neg_matches) * 0.15 + exclamations * 0.3, 1.0)

        return valence, arousal
