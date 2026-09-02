import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import Principal, get_current_principal, require_roles
from app.core.permissions import Role
from app.modules.identity.schemas import (
    LoginRequest,
    RefreshRequest,
    TokenPair,
    UserCreate,
    UserOut,
)
from app.modules.identity.service import AuthService, UserService

router = APIRouter()


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login(payload)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.refresh(payload.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(principal: Principal = Depends(get_current_principal)):
    # TODO: add refresh-token/session blacklist (Redis) once session store lands.
    return None


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(
        require_roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_ADMIN, Role.DEPARTMENT_ADMIN)
    ),
):
    """Section 6.1 step 6 - invite/import users; validate duplicates."""
    service = UserService(db)
    return await service.create_user(principal.tenant_id, payload, actor_user_id=principal.user_id)


@router.get("/users/me", response_model=UserOut)
async def get_me(
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    service = UserService(db)
    return await service.get_user(principal.user_id)


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(
        require_roles(Role.INSTITUTION_ADMIN, Role.ACADEMIC_ADMIN, Role.DEPARTMENT_ADMIN)
    ),
):
    service = UserService(db)
    return await service.get_user(user_id)
