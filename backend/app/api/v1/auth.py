"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, create_access_token
from app.models.database import User, get_db

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    tenant_id: str
    full_name: str | None


class MeResponse(BaseModel):
    user_id: str
    tenant_id: str
    email: str
    full_name: str | None

    model_config = {"from_attributes": True}


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate a mairie agent and return a JWT token."""
    result = await db.execute(
        select(User).where(User.email == request.email, User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )

    token = create_access_token(
        data={"sub": str(user.id), "tenant_id": str(user.tenant_id)}
    )

    return LoginResponse(
        access_token=token,
        user_id=str(user.id),
        tenant_id=str(user.tenant_id),
        full_name=user.full_name,
    )
