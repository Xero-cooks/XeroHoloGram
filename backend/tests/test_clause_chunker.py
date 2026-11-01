from backend.app.chunker.clause_chunker import ClauseChunker


def test_clause_chunker_punctuation_splits():
    chunker = ClauseChunker(min_clause_length=10)

    tokens = ["Hello ", "there! ", "How ", "are ", "you ", "today? ", "I ", "am ", "doing ", "well."]
    all_clauses = []

    for token in tokens:
        clauses = chunker.feed_token(token)
        all_clauses.extend(clauses)

    remaining = chunker.flush()
    all_clauses.extend(remaining)

    assert len(all_clauses) == 3
    assert "Hello there!" in all_clauses[0]
    assert "How are you today?" in all_clauses[1]
    assert "I am doing well." in all_clauses[2]


def test_clause_chunker_abbreviation_preservation():
    chunker = ClauseChunker(min_clause_length=10)

    # "Dr. Watson is here." should NOT split at "Dr."
    tokens = ["Dr. ", "Watson ", "is ", "standing ", "here."]
    all_clauses = []

    for token in tokens:
        clauses = chunker.feed_token(token)
        all_clauses.extend(clauses)

    all_clauses.extend(chunker.flush())

    assert len(all_clauses) == 1
    assert all_clauses[0] == "Dr. Watson is standing here."
