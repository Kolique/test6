"""Conversations endpoint — opt-in only."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Conversation, Tenant, get_db

router = APIRouter(prefix="/conversations", tags=["conversations"])


class ConversationOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    messages: list
    created_at: str

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    conversations: list[ConversationOut]
    total: int


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    tenant_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List conversations for a tenant (only if logging is enabled)."""
    # Check if tenant has logging enabled
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Mairie non trouvee.")

    if not tenant.log_conversations:
        return ConversationListResponse(conversations=[], total=0)

    result = await db.execute(
        select(Conversation)
        .where(Conversation.tenant_id == tenant_id)
        .order_by(Conversation.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    convos = result.scalars().all()

    return ConversationListResponse(
        conversations=[
            ConversationOut(
                id=c.id,
                tenant_id=c.tenant_id,
                messages=c.messages,
                created_at=c.created_at.isoformat(),
            )
            for c in convos
        ],
        total=len(convos),
    )


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation (droit a l'oubli RGPD)."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == tenant_id,
        )
    )
    convo = result.scalar_one_or_none()
    if convo is None:
        raise HTTPException(status_code=404, detail="Conversation non trouvee.")

    await db.delete(convo)
    await db.commit()
