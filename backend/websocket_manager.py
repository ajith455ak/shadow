"""Shadow Nexus — Enterprise WebSocket Connection Manager.
Manages active WebSocket connections with JWT authentication, rooms, heartbeat ping/pong, and broadcasting.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Set
from fastapi import WebSocket, status
import jwt

log = logging.getLogger("shadow_nexus.websocket")


class ConnectionManager:
    """Manages active WebSocket connections by user, room, and session."""

    def __init__(self):
        # Map: room_id -> Set of WebSockets
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # Map: WebSocket -> dict of connection metadata (user_id, room_id, connected_at)
        self.connections: Dict[WebSocket, Dict[str, Any]] = {}
        # Map: user_id -> Set of WebSockets (for multi-device users)
        self.user_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, metadata: Optional[Dict[str, Any]] = None):
        """Accept WebSocket connection and register connection pools."""
        await websocket.accept()
        meta = {
            "user_id": user_id,
            "room_id": room_id,
            "connected_at": asyncio.get_event_loop().time(),
            **(metadata or {}),
        }
        self.connections[websocket] = meta

        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(websocket)

        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        log.info(f"WebSocket connected: user={user_id}, room={room_id}")

    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection from pools."""
        meta = self.connections.pop(websocket, None)
        if not meta:
            return

        room_id = meta.get("room_id")
        user_id = meta.get("user_id")

        if room_id and room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        log.info(f"WebSocket disconnected: user={user_id}, room={room_id}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send JSON message to specific WebSocket connection."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            log.error(f"Error sending WebSocket personal message: {e}")

    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any], exclude: Optional[WebSocket] = None):
        """Broadcast message to all WebSockets in a room."""
        sockets = list(self.rooms.get(room_id, []))
        for ws in sockets:
            if ws != exclude:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    log.error(f"Error broadcasting to room {room_id}: {e}")
                    self.disconnect(ws)

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all active devices of a specific user."""
        sockets = list(self.user_connections.get(user_id, []))
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception as e:
                log.error(f"Error sending to user {user_id}: {e}")
                self.disconnect(ws)


# Global Singleton Connection Manager Instance
manager = ConnectionManager()


def authenticate_websocket_token(token: str, jwt_secret: str, jwt_alg: str = "HS256") -> str:
    """Validate JWT token passed in WebSocket handshake query string."""
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_alg])
        sub = payload.get("sub")
        if not sub:
            raise ValueError("Invalid token subject")
        return sub
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid JWT token: {e}")
