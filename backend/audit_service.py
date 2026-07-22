"""Shadow Nexus — Enterprise Audit Logging Service.
Logs security, authentication, and administrative actions to MongoDB db.audit_logs.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

log = logging.getLogger("shadow_nexus.audit")


async def log_audit_event(
    db: Any,
    *,
    user_id: Optional[str] = None,
    username: Optional[str] = None,
    action: str,
    ip: str = "unknown",
    device: str = "unknown",
    success: bool = True,
    resource: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Insert structured audit event into db.audit_logs."""
    event = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "username": username or "anonymous",
        "action": action,
        "ip": ip,
        "device": device,
        "success": success,
        "resource": resource or action,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    try:
        await db.audit_logs.insert_one(event.copy())
    except Exception as e:
        log.error(f"Failed to write audit event: {e}")

    return event
