"""
FastAPI Application

Main FastAPI application with all routes
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import time
import os
from .routes import translation, health, voice
from ..utils.logger import get_logger
from ..utils.sentry_integration import init_sentry

logger = get_logger("api")

# Initialize Sentry for error tracking
sentry_dsn = os.getenv("SENTRY_API_DSN")
if sentry_dsn:
    init_sentry(dsn=sentry_dsn, service_name="api")
    logger.info("✅ Sentry error tracking initialized")
else:
    logger.warning("⚠️  Sentry not configured. Error tracking disabled.")

app = FastAPI(
    title="ROMA Translation Bot",
    description="Intelligent translation API powered by ROMA framework and Hugging Face",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(translation.router)
app.include_router(health.router)
app.include_router(voice.router)

# Serve frontend static files
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    # Mount assets directory
    assets_path = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
    logger.info(f"✅ Frontend static files mounted from {frontend_dist}")
else:
    logger.warning(f"⚠️  Frontend dist not found at {frontend_dist}")

# Simple rate limiting for free tier
request_counts = {}


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting - 20 requests per minute (FREE tier)"""
    
    client_ip = request.client.host if request.client else "unknown"
    current_minute = int(time.time() / 60)
    key = f"{client_ip}:{current_minute}"
    
    if key in request_counts:
        request_counts[key] += 1
        if request_counts[key] > 20:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Free tier: 20 requests per minute",
                    "retry_after": 60
                }
            )
    else:
        request_counts[key] = 1
    
    # Cleanup old entries
    old_keys = [
        k for k in request_counts.keys()
        if int(k.split(':')[1]) < current_minute - 5
    ]
    for k in old_keys:
        del request_counts[k]
    
    response = await call_next(request)
    return response


@app.get("/")
async def root():
    """Serve index.html for SPA or API info if frontend not built"""
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    
    # Fallback API info if frontend not available
    return {
        "name": "ROMA Translation Bot",
        "version": "1.0.0",
        "description": "Intelligent translation API powered by ROMA framework",
        "cost": "$0 - Completely FREE!",
        "endpoints": {
            "translate": "POST /api/v1/translate",
            "detect": "POST /api/v1/detect",
            "transcribe": "POST /api/v1/transcribe",
            "voice_translate": "POST /api/v1/voice-translate",
            "languages": "GET /api/v1/languages",
            "health": "GET /api/v1/health"
        },
        "docs": "/docs",
        "resources": {
            "llm": "Hugging Face (free tier - 1000 requests/day)",
            "database": "SQLite (built-in)",
            "cache": "In-memory (free)",
            "framework": "ROMA (Recursive-Open-Meta-Agent)"
        }
    }


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve SPA routes - fallback to index.html for non-API routes"""
    # Don't intercept API routes
    if full_path.startswith("api/"):
        return {"error": "Not found"}
    
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    
    return {"error": "Frontend not built"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

