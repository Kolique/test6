"""RAG pipeline: semantic search + response generation with guardrails."""

import uuid

from sqlalchemy import text as sql_text
from sqlalchemy.ext.asyncio import AsyncSession
from mistralai import Mistral

from app.core.config import settings
from app.services.embeddings import embed_query

_client: Mistral | None = None


def _get_client() -> Mistral:
    global _client
    if _client is None:
        _client = Mistral(api_key=settings.mistral_api_key)
    return _client


SYSTEM_PROMPT = """Tu es MairIA, l'assistant virtuel officiel de la mairie. Tu reponds uniquement aux questions des citoyens concernant la mairie et ses services.

REGLES STRICTES :
1. Tu reponds UNIQUEMENT a partir des documents fournis dans le contexte ci-dessous. JAMAIS d'information inventee.
2. Si l'information demandee n'est PAS dans les documents fournis, tu reponds exactement : "Je n'ai pas cette information dans mes documents. Je vous invite a contacter directement la mairie pour obtenir une reponse precise."
3. Tu refuses poliment toute question sans rapport avec les services municipaux (politique nationale, opinions personnelles, sujets controverses, etc.).
4. Tu restes courtois, professionnel et concis.
5. Tu cites la source quand c'est possible (nom du document).
6. Tu utilises le vouvoiement.
7. Tu ne donnes JAMAIS de conseil juridique. Pour les questions juridiques, tu orientes vers la mairie ou les services competents.

CONTEXTE (documents de la mairie) :
{context}"""


async def search_chunks(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    query_embedding: list[float],
    top_k: int | None = None,
    threshold: float | None = None,
) -> list[dict]:
    """Search for the most relevant document chunks using cosine similarity."""
    top_k = top_k or settings.rag_top_k
    threshold = threshold or settings.rag_similarity_threshold

    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    query = sql_text("""
        SELECT
            dc.content,
            dc.chunk_index,
            dc.metadata,
            d.filename,
            1 - (dc.embedding <=> :embedding::vector) AS similarity
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.tenant_id = :tenant_id
            AND d.status = 'indexed'
            AND 1 - (dc.embedding <=> :embedding::vector) >= :threshold
        ORDER BY dc.embedding <=> :embedding::vector
        LIMIT :top_k
    """)

    result = await db.execute(
        query,
        {
            "tenant_id": str(tenant_id),
            "embedding": embedding_str,
            "threshold": threshold,
            "top_k": top_k,
        },
    )
    rows = result.fetchall()

    return [
        {
            "content": row.content,
            "chunk_index": row.chunk_index,
            "metadata": row.metadata,
            "filename": row.filename,
            "similarity": float(row.similarity),
        }
        for row in rows
    ]


def _build_context(chunks: list[dict]) -> str:
    """Build context string from retrieved chunks."""
    if not chunks:
        return "Aucun document pertinent trouve."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk["filename"]
        parts.append(f"[Source: {source}]\n{chunk['content']}")
    return "\n\n---\n\n".join(parts)


async def generate_response(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    user_message: str,
) -> dict:
    """Full RAG pipeline: embed query → search → generate response."""
    # 1. Embed the user query
    query_embedding = await embed_query(user_message)

    # 2. Search relevant chunks
    chunks = await search_chunks(db, tenant_id, query_embedding)

    # 3. Build context and prompt
    context = _build_context(chunks)
    system_message = SYSTEM_PROMPT.format(context=context)

    # 4. Generate response with Mistral
    client = _get_client()
    response = await client.chat.complete_async(
        model=settings.mistral_chat_model,
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ],
        temperature=0.1,
        max_tokens=1024,
    )

    answer = response.choices[0].message.content

    sources = list({chunk["filename"] for chunk in chunks})

    return {
        "answer": answer,
        "sources": sources,
        "chunks_used": len(chunks),
    }
