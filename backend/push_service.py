"""Shadow Nexus — Expo Push Notification Service.
Asynchronous batch push notification dispatch with exponential retries and error logging.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import httpx

log = logging.getLogger("shadow_nexus.push")

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_expo_push_notifications(
    messages: List[Dict[str, Any]],
    retries: int = 3,
) -> Dict[str, Any]:
    """Send batch push notifications via Expo API with retry support."""
    if not messages:
        return {"sent": 0, "errors": []}

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
    }

    errors = []
    sent_count = 0

    async with httpx.AsyncClient(timeout=10.0) as client:
        for attempt in range(1, retries + 1):
            try:
                response = await client.post(EXPO_PUSH_URL, json=messages, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    tickets = data.get("data", [])
                    for idx, ticket in enumerate(tickets):
                        if ticket.get("status") == "ok":
                            sent_count += 1
                        else:
                            err_msg = ticket.get("message") or ticket.get("details", {}).get("error")
                            log.error(f"Push ticket error for message {idx}: {err_msg}")
                            errors.append({"index": idx, "error": err_msg})
                    break
                else:
                    log.warning(f"Expo push API returned status {response.status_code} (attempt {attempt}/{retries})")
            except Exception as e:
                log.error(f"Failed to send push notification (attempt {attempt}/{retries}): {e}")
                errors.append({"attempt": attempt, "error": str(e)})

    return {"sent": sent_count, "total": len(messages), "errors": errors}


def build_push_message(
    token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    badge: int = 1,
    sound: str = "default",
) -> Dict[str, Any]:
    """Construct standard Expo push message payload."""
    payload: Dict[str, Any] = {
        "to": token,
        "title": title,
        "body": body,
        "sound": sound,
        "badge": badge,
        "_displayInForeground": True,
    }
    if data:
        payload["data"] = data
    return payload
