"""Zoom live-session endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.demo_auth import DemoPrincipal, get_demo_principal, require_portal_roles
from app.core.permissions import Role
from app.modules.live_sessions.schemas import (
    ZoomMeetingCreate,
    ZoomMeetingOut,
    ZoomMeetingStatusOut,
    ZoomStatusOut,
)
from app.modules.live_sessions.service import LiveSessionsService

router = APIRouter()

# Creating or ending meetings uses the institution's Zoom account.
require_session_host = require_portal_roles(Role.INSTRUCTOR, Role.TEACHING_ASSISTANT)


@router.get("/zoom/status", response_model=ZoomStatusOut)
async def zoom_status(_principal: DemoPrincipal = Depends(get_demo_principal)):
    return LiveSessionsService.status()


@router.post("/zoom/meetings", response_model=ZoomMeetingOut)
async def create_zoom_meeting(
    payload: ZoomMeetingCreate,
    db: AsyncSession = Depends(get_db),
    _principal: DemoPrincipal = Depends(require_session_host),
):
    return await LiveSessionsService(db).create_zoom_meeting(payload)


@router.get("/zoom/meetings/{meeting_id}", response_model=ZoomMeetingStatusOut)
async def zoom_meeting_status(
    meeting_id: str,
    db: AsyncSession = Depends(get_db),
    _principal: DemoPrincipal = Depends(get_demo_principal),
):
    return await LiveSessionsService(db).zoom_meeting_status(meeting_id)


@router.post("/zoom/meetings/{meeting_id}/end", response_model=ZoomMeetingStatusOut)
async def end_zoom_meeting(
    meeting_id: str,
    db: AsyncSession = Depends(get_db),
    _principal: DemoPrincipal = Depends(require_session_host),
):
    return await LiveSessionsService(db).end_zoom_meeting(meeting_id)
