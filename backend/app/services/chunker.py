"""Split text into overlapping chunks for embedding."""

import re

from app.core.config import settings


def clean_text(text: str) -> str:
    """Normalize whitespace and remove control characters."""
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[str]:
    """Split text into chunks with overlap.

    Tries to split on paragraph boundaries first, then sentence boundaries,
    then falls back to character-level splitting.
    """
    chunk_size = chunk_size if chunk_size is not None else settings.chunk_size
    chunk_overlap = chunk_overlap if chunk_overlap is not None else settings.chunk_overlap

    text = clean_text(text)
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    # Split on double newlines (paragraphs)
    paragraphs = re.split(r"\n\n+", text)

    chunks: list[str] = []
    current_chunk = ""

    for para in paragraphs:
        # If a single paragraph is too long, split it by sentences
        if len(para) > chunk_size:
            sentences = re.split(r"(?<=[.!?])\s+", para)
            for sentence in sentences:
                if len(current_chunk) + len(sentence) + 1 <= chunk_size:
                    current_chunk = f"{current_chunk} {sentence}".strip()
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    # If a single sentence is too long, hard-split it
                    if len(sentence) > chunk_size:
                        for i in range(0, len(sentence), chunk_size - chunk_overlap):
                            chunks.append(sentence[i : i + chunk_size])
                        current_chunk = ""
                    else:
                        current_chunk = sentence
        elif len(current_chunk) + len(para) + 2 <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{para}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    # Apply overlap: prepend end of previous chunk to next chunk
    if chunk_overlap > 0 and len(chunks) > 1:
        overlapped: list[str] = [chunks[0]]
        for i in range(1, len(chunks)):
            prev_tail = chunks[i - 1][-chunk_overlap:]
            overlapped.append(f"{prev_tail} {chunks[i]}".strip())
        return overlapped

    return chunks
