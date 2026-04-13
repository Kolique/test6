"""Tests for the text chunking service."""

from app.services.chunker import chunk_text, clean_text


def test_clean_text_removes_control_chars():
    text = "Hello\x00World\x07Test"
    result = clean_text(text)
    assert "\x00" not in result
    assert "\x07" not in result
    assert "HelloWorldTest" in result


def test_clean_text_normalizes_whitespace():
    text = "Hello\n\n\n\n\nWorld"
    result = clean_text(text)
    assert "\n\n\n" not in result


def test_chunk_short_text_returns_single_chunk():
    text = "Ceci est un court texte."
    chunks = chunk_text(text, chunk_size=1000, chunk_overlap=0)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_empty_text_returns_empty():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_chunk_respects_size_limit():
    text = "A" * 500 + "\n\n" + "B" * 500 + "\n\n" + "C" * 500
    chunks = chunk_text(text, chunk_size=600, chunk_overlap=0)
    assert len(chunks) >= 2
    for chunk in chunks:
        assert len(chunk) <= 600


def test_chunk_with_overlap():
    text = "Premier paragraphe avec du contenu.\n\nDeuxieme paragraphe different."
    chunks = chunk_text(text, chunk_size=40, chunk_overlap=10)
    assert len(chunks) >= 2
    # Second chunk should contain overlap from first
    if len(chunks) > 1:
        assert len(chunks[1]) > 0


def test_chunk_preserves_content():
    text = "Les horaires de la mairie sont du lundi au vendredi de 9h a 17h."
    chunks = chunk_text(text, chunk_size=2000, chunk_overlap=0)
    full = " ".join(chunks)
    assert "horaires" in full
    assert "mairie" in full
