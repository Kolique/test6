"""Pydantic schemas for document management."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl


class DocumentOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    filename: str
    file_type: str
    file_size_bytes: int | None
    source_url: str | None
    status: str
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentOut]
    total: int


class IndexUrlRequest(BaseModel):
    tenant_id: uuid.UUID
    url: str = Field(..., min_length=10)
