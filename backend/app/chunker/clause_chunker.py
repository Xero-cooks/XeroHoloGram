import re
from typing import Generator, List


class ClauseChunker:
    # Common abbreviations that should NOT trigger a clause split
    ABBREVIATIONS = {"mr.", "mrs.", "dr.", "ms.", "prof.", "sr.", "jr.", "vs.", "e.g.", "i.e.", "etc."}
    PUNCTUATION_SPLIT_REGEX = re.compile(r"([.!?,;:\n—]+)")

    def __init__(self, min_clause_length: int = 15):
        self.buffer = ""
        self.min_clause_length = min_clause_length

    def feed_token(self, token: str) -> List[str]:
        self.buffer += token
        return self._extract_ready_clauses()

    def flush(self) -> List[str]:
        remains = self.buffer.strip()
        self.buffer = ""
        return [remains] if remains else []

    def _extract_ready_clauses(self) -> List[str]:
        clauses = []
        parts = self.PUNCTUATION_SPLIT_REGEX.split(self.buffer)

        # parts alternates: [text, punctuation, text, punctuation, ...]
        if len(parts) >= 3:
            accumulated = ""
            i = 0
            while i < len(parts) - 1:
                text_part = parts[i]
                punct_part = parts[i + 1]
                candidate = accumulated + text_part + punct_part

                # Check if it ends with an abbreviation
                last_word = text_part.strip().split()[-1].lower() + punct_part if text_part.strip() else ""
                if last_word in self.ABBREVIATIONS:
                    accumulated = candidate
                    i += 2
                    continue

                if len(candidate.strip()) >= self.min_clause_length or punct_part in {".", "!", "?", "\n"}:
                    clauses.append(candidate.strip())
                    accumulated = ""
                else:
                    accumulated = candidate
                i += 2

            # Remaining un-split text back to buffer
            self.buffer = accumulated + (parts[-1] if i < len(parts) else "")

        return clauses
