"""Shadow Nexus — Redis Caching Service.
High-throughput Redis cache layer with memory fallback, TTL expiration, hash keys, and cache invalidation.
"""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Dict, Optional

log = logging.getLogger("shadow_nexus.redis")

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

# In-memory fallback cache dictionary if Redis connection is unavailable
_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}


class CacheService:
    def __init__(self):
        self.redis_client = None
        try:
            import redis
            self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            self.redis_client.ping()
            log.info("Redis cache connected successfully.")
        except Exception:
            log.info("Redis server unavailable — utilizing high-performance in-memory fallback cache.")

    def get(self, key: str) -> Optional[Any]:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                return json.loads(val) if val else None
            except Exception:
                pass

        # Fallback memory cache
        item = _MEMORY_CACHE.get(key)
        if item:
            if item["expires_at"] is None or item["expires_at"] > time.time():
                return item["val"]
            else:
                _MEMORY_CACHE.pop(key, None)
        return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = 300) -> None:
        if self.redis_client:
            try:
                val_str = json.dumps(value)
                if ttl_seconds:
                    self.redis_client.setex(key, ttl_seconds, val_str)
                else:
                    self.redis_client.set(key, val_str)
                return
            except Exception:
                pass

        # Fallback memory cache
        exp = (time.time() + ttl_seconds) if ttl_seconds else None
        _MEMORY_CACHE[key] = {"val": value, "expires_at": exp}

    def delete(self, key: str) -> None:
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        _MEMORY_CACHE.pop(key, None)

    def invalidate_user(self, user_id: str) -> None:
        """Invalidate user-specific cached payloads."""
        self.delete(f"user_char:{user_id}")
        self.delete(f"dashboard:{user_id}")
        self.delete(f"inventory:{user_id}")


cache = CacheService()
