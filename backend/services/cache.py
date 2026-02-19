
import os
import time
import json
import logging
from typing import Any, Optional, Dict

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.redis_client = None
        self.memory_cache: Dict[str, Any] = {}
        self.memory_ttl: Dict[str, float] = {}
        
        redis_url = os.getenv("REDIS_URL")
        
        if redis_url:
            try:
                import redis
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                logger.info("Connected to Redis for caching.")
            except ImportError:
                logger.warning("redis-py not installed. Using in-memory cache.")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}. Using in-memory cache.")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (Redis or Memory)"""
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                return json.loads(val) if val else None
            except Exception as e:
                logger.error(f"Redis get error: {e}")
                return None
        else:
            # Check memory cache
            if key in self.memory_cache:
                expiry = self.memory_ttl.get(key, 0)
                if time.time() < expiry:
                    return self.memory_cache[key]
                else:
                    # Expired
                    del self.memory_cache[key]
                    del self.memory_ttl[key]
            return None

    async def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL (default 5 mins)"""
        if self.redis_client:
            try:
                self.redis_client.setex(key, ttl, json.dumps(value))
            except Exception as e:
                logger.error(f"Redis set error: {e}")
        else:
            self.memory_cache[key] = value
            self.memory_ttl[key] = time.time() + ttl
            
            # Simple cleanup of expired keys if cache grows too big (basic protection)
            if len(self.memory_cache) > 1000:
                self._cleanup()
    
    async def delete(self, key: str):
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        else:
            if key in self.memory_cache:
                del self.memory_cache[key]
                del self.memory_ttl[key]

    async def incr(self, key: str, ttl: int = 60) -> int:
        """Increment count, reset if expired"""
        if self.redis_client:
            try:
                # Use pipeline for atomic incr + separate expire call if needed
                pipe = self.redis_client.pipeline()
                pipe.incr(key)
                pipe.expire(key, ttl)
                res = pipe.execute()
                return res[0]
            except Exception as e:
                logger.error(f"Redis incr error: {e}")
                return 1
        else:
            # Memory cache logic
            now = time.time()
            if key in self.memory_ttl and self.memory_ttl[key] < now:
                del self.memory_cache[key]
                del self.memory_ttl[key]

            curr = self.memory_cache.get(key, 0)
            if not isinstance(curr, int): curr = 0
            
            new_val = curr + 1
            self.memory_cache[key] = new_val
            
            if key not in self.memory_ttl:
                self.memory_ttl[key] = now + ttl
            
            return new_val

    def _cleanup(self):
        now = time.time()
        expired = [k for k, t in self.memory_ttl.items() if t < now]
        for k in expired:
            del self.memory_cache[k]
            del self.memory_ttl[k]

# Global instance
cache_service = CacheService()
