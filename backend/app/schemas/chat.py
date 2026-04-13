"""Pydantic schemas for the chat endpoint."""

import uuid
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    tenant_id: uuid.UUID
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    chunks_used: int
