"""Chat endpoint — the core RAG-powered conversation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Tenant, get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag import generate_response

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Answer a citizen's question using RAG."""
    # Verify tenant exists and is active
    result = await db.execute(
        select(Tenant).where(
            Tenant.id == request.tenant_id,
            Tenant.is_active.is_(True),
        )
    )
    tenant = result.scalar_one_or_none()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Mairie non trouvee ou inactive.")

    try:
        response = await generate_response(
            db=db,
            tenant_id=request.tenant_id,
            user_message=request.message,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la generation de la reponse. Veuillez reessayer.",
        )

    return ChatResponse(**response)
