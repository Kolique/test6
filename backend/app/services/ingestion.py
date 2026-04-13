"""Document ingestion pipeline: parse → chunk → embed → store."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update

from app.models.database import Document, DocumentChunk
from app.services.document_parser import parse_document
from app.services.chunker import chunk_text
from app.services.embeddings import embed_texts


async def ingest_document(
    db: AsyncSession,
    document_id: uuid.UUID,
    tenant_id: uuid.UUID,
    filename: str,
    file_bytes: bytes,
) -> int:
    """Full ingestion pipeline for a document.

    Returns the number of chunks created.
    """
    # 1. Update status to processing
    await db.execute(
        update(Document)
        .where(Document.id == document_id)
        .values(status="processing")
    )
    await db.commit()

    try:
        # 2. Parse document
        text = parse_document(file_bytes, filename)
        if not text.strip():
            await db.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(status="error")
            )
            await db.commit()
            raise ValueError("Le document ne contient aucun texte extractible.")

        # 3. Chunk text
        chunks = chunk_text(text)

        # 4. Generate embeddings (in batches of 10)
        all_embeddings: list[list[float]] = []
        batch_size = 10
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            embeddings = await embed_texts(batch)
            all_embeddings.extend(embeddings)

        # 5. Store chunks with embeddings
        db_chunks = []
        for i, (chunk_content, embedding) in enumerate(zip(chunks, all_embeddings)):
            db_chunk = DocumentChunk(
                document_id=document_id,
                tenant_id=tenant_id,
                content=chunk_content,
                chunk_index=i,
                embedding=embedding,
                metadata={"filename": filename, "chunk_index": i},
            )
            db_chunks.append(db_chunk)

        db.add_all(db_chunks)

        # 6. Update document status
        await db.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(status="indexed", chunk_count=len(chunks))
        )
        await db.commit()

        return len(chunks)

    except Exception as e:
        await db.rollback()
        await db.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(status="error")
        )
        await db.commit()
        raise e
