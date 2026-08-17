"""
Auth + user business logic (Blueprint Section 6.1 steps 5-7, Section 16
Authentication requirements).
"""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.audit import write_audit_log
from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.modules.identity.models import User, UserRoleAssignment, UserStatus
from app.modules.identity.repository import UserRepository
from app.modules.identity.schemas import LoginRequest, TokenPair, UserCreate
from app.modules.tenants.repository import TenantRepository


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.tenant_repo = TenantRepository(db)

    async def login(self, payload: LoginRequest) -> TokenPair:
        tenant = await self.tenant_repo.get_by_code(payload.tenant_code)
        if not tenant:
            raise ValidationAppError("Unknown institution code")

        user = await self.user_repo.get_by_email_and_tenant(payload.email, tenant.id)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise ValidationAppError("Invalid email or password")

        if user.status != UserStatus.ACTIVE:
            raise ValidationAppError("Account is not active")

        role_assignment = await self.user_repo.get_primary_role_assignment(user.id)
        if not role_assignment:
            raise ValidationAppError("User has no assigned role")

        claims = {"tenant_id": str(user.tenant_id), "role": role_assignment.role.value}
        access_token = create_access_token(subject=str(user.id), extra_claims=claims)
        refresh_token = create_refresh_token(subject=str(user.id))

        await write_audit_log(
            self.db,
            tenant_id=user.tenant_id,
            actor_user_id=user.id,
            action="auth.login_succeeded",
            resource_type="User",
            resource_id=str(user.id),
        )
        await self.db.commit()
        return TokenPair(access_token=access_token, refresh_token=refresh_token)

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token)  # raises JWTError -> handled by caller/middleware
        if payload.get("type") != "refresh":
            raise ValidationAppError("Invalid refresh token")

        user = await self.user_repo.get_by_id(uuid.UUID(payload["sub"]))
        if not user or user.status != UserStatus.ACTIVE:
            raise ValidationAppError("Account is not active")

        role_assignment = await self.user_repo.get_primary_role_assignment(user.id)
        claims = {"tenant_id": str(user.tenant_id), "role": role_assignment.role.value}
        new_access = create_access_token(subject=str(user.id), extra_claims=claims)
        new_refresh = create_refresh_token(subject=str(user.id))
        return TokenPair(access_token=new_access, refresh_token=new_refresh)


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def create_user(self, tenant_id: uuid.UUID, data: UserCreate, actor_user_id: uuid.UUID) -> User:
        existing = await self.user_repo.get_by_email_and_tenant(data.email, tenant_id)
        if existing:
            raise ConflictError("A user with this email already exists in this institution")

        user = User(
            tenant_id=tenant_id,
            email=data.email,
            display_name=data.display_name,
            hashed_password=hash_password(data.password),
            status=UserStatus.INVITED,
        )
        user = await self.user_repo.create(user)

        role_assignment = UserRoleAssignment(tenant_id=tenant_id, user_id=user.id, role=data.role)
        self.db.add(role_assignment)
        await self.db.flush()

        await write_audit_log(
            self.db,
            tenant_id=tenant_id,
            actor_user_id=actor_user_id,
            action="user.invited",
            resource_type="User",
            resource_id=str(user.id),
            after_state={"email": data.email, "role": data.role.value},
        )
        await self.db.commit()
        return user

    async def get_user(self, user_id: uuid.UUID) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user
