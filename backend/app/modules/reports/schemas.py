"""
Reports & Analytics module - Pydantic request/response schemas.

Follow the pattern in app/modules/tenants/schemas.py:
- one *Create schema per entity for POST bodies
- one *Out schema per entity for responses (model_config = ConfigDict(from_attributes=True))
"""
# TODO(Cross-cutting): define schemas for: (none - orchestration/read-model module)
