"""Document management endpoints: upload, list, delete, index URL."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.database import Document, DocumentChunk, Tenant, get_db
from app.schemas.documents import DocumentOut, DocumentListResponse, IndexUrlRequest
from app.services.ingestion import ingest_document
from app.services.url_scraper import scrape_url
from app.services.chunker import chunk_text
from app.services.embeddings import embed_texts

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    tenant_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload and index a PDF or DOCX document."""
    # Verify tenant
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Mairie non trouvee.")

    # Validate file type
    content_type = file.content_type or ""
    file_type = ALLOWED_TYPES.get(content_type)
    if file_type is None:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non supporte ({content_type}). Utilisez PDF ou DOCX.",
        )

    # Read file
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Check size limit
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux ({file_size // (1024*1024)} Mo). Maximum : {settings.max_upload_size_mb} Mo.",
        )

    # Create document record
    doc = Document(
        tenant_id=tenant_id,
        filename=file.filename or "document",
        file_type=file_type,
        file_size_bytes=file_size,
        status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Ingest in the same request (synchronous for MVP)
    try:
        chunk_count = await ingest_document(
            db=db,
            document_id=doc.id,
            tenant_id=tenant_id,
            filename=doc.filename,
            file_bytes=file_bytes,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await db.refresh(doc)
    return doc


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all documents for a tenant."""
    result = await db.execute(
        select(Document)
        .where(Document.tenant_id == tenant_id)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()

    return DocumentListResponse(documents=docs, total=len(docs))


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and all its chunks."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.tenant_id == tenant_id,
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document non trouve.")

    await db.execute(
        delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
    )
    await db.delete(doc)
    await db.commit()


@router.post("/index-url", response_model=DocumentOut, status_code=201)
async def index_url(
    request: IndexUrlRequest,
    db: AsyncSession = Depends(get_db),
):
    """Scrape a URL and index its content."""
    # Verify tenant
    result = await db.execute(select(Tenant).where(Tenant.id == request.tenant_id))
    tenant = result.scalar_one_or_none()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Mairie non trouvee.")

    # Scrape URL
    try:
        title, text_content = await scrape_url(request.url)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de recuperer le contenu de l'URL : {e}",
        )

    # Create document record
    doc = Document(
        tenant_id=request.tenant_id,
        filename=title,
        file_type="url",
        file_size_bytes=len(text_content.encode("utf-8")),
        source_url=request.url,
        status="processing",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Chunk and embed
    try:
        chunks = chunk_text(text_content)
        all_embeddings: list[list[float]] = []
        batch_size = 10
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            embeddings = await embed_texts(batch)
            all_embeddings.extend(embeddings)

        db_chunks = []
        for i, (chunk_content, embedding) in enumerate(zip(chunks, all_embeddings)):
            db_chunk = DocumentChunk(
                document_id=doc.id,
                tenant_id=request.tenant_id,
                content=chunk_content,
                chunk_index=i,
                embedding=embedding,
                metadata={"source_url": request.url, "title": title, "chunk_index": i},
            )
            db_chunks.append(db_chunk)

        db.add_all(db_chunks)
        doc.status = "indexed"
        doc.chunk_count = len(chunks)
        await db.commit()
        await db.refresh(doc)

    except Exception as e:
        doc.status = "error"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'indexation : {e}")

    return doc
