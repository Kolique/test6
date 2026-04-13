"""Tenant management endpoint (minimal for MVP)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Tenant, get_db

router = APIRouter(prefix="/tenants", tags=["tenants"])


class TenantOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    primary_color: str | None
    contact_email: str | None
    website_url: str | None
    log_conversations: bool

    model_config = {"from_attributes": True}


@router.get("/{tenant_id}", response_model=TenantOut)
async def get_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get tenant configuration (used by the widget)."""
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id, Tenant.is_active.is_(True))
    )
    tenant = result.scalar_one_or_none()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Mairie non trouvee.")
    return tenant
