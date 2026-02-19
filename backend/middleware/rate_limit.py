
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from services.cache import cache_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Identify Client (IP)
        client_ip = request.client.host if request.client else "unknown"
        
        # 2. Determine Limit based on Path
        path = request.url.path
        limit = 100 # Default per minute
        window = 60
        
        if path.startswith("/api/v1/auth"):
            limit = 10 # Strict for auth
        elif path.startswith("/api/v1/admin"):
             limit = 50
        elif path.startswith("/docs") or path.startswith("/openapi.json"):
             limit = 200 # Allow docs
        
        # 3. Cache Key
        # "rate_limit:{ip}:{path_prefix}"? Or just global IP limit?
        # Usually global IP limit protects server.
        # But auth specific limit protects login.
        if path.startswith("/api/v1/auth"):
             key = f"rate_limit:{client_ip}:auth"
        else:
             key = f"rate_limit:{client_ip}:global"

        # 4. Increment & Check
        try:
            current_count = await cache_service.incr(key, ttl=window)
            
            if current_count > limit:
                return Response("Too Many Requests", status_code=429, headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": str(window)
                })

            response = await call_next(request)
            remaining = max(0, limit - current_count)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            
            return response
        except Exception as e:
            # If cache fails, allow request (fail open) to avoid blocking legitimate users
            logger.error(f"Rate limit error: {e}")
            return await call_next(request)
