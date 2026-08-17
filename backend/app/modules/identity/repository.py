import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity.models import User, UserRoleAssignment


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email_and_tenant(self, email: str, tenant_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email, User.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_primary_role_assignment(self, user_id: uuid.UUID) -> UserRoleAssignment | None:
        """
        MVP simplification: returns the first tenant-wide role assignment.
        Extend to return the full assignment set once scoped-role UI lands
        (a user may hold multiple roles/scopes - Section 3.1).
        """
        result = await self.db.execute(
            select(UserRoleAssignment).where(UserRoleAssignment.user_id == user_id)
        )
        return result.scalars().first()
