"""Mistral embeddings client."""

from mistralai import Mistral

from app.core.config import settings

_client: Mistral | None = None


def _get_client() -> Mistral:
    global _client
    if _client is None:
        _client = Mistral(api_key=settings.mistral_api_key)
    return _client


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts using Mistral API.

    Returns a list of 1024-dimensional vectors.
    """
    client = _get_client()
    # Mistral embed API accepts batches
    response = await client.embeddings.create_async(
        model=settings.mistral_embed_model,
        inputs=texts,
    )
    return [item.embedding for item in response.data]


async def embed_query(text: str) -> list[float]:
    """Generate embedding for a single query."""
    results = await embed_texts([text])
    return results[0]
