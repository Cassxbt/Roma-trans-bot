"""
FastAPI Application

Main FastAPI application with all routes
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from .routes import translation, health

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
    """API info"""
    return {
        "name": "ROMA Translation Bot",
        "version": "1.0.0",
        "description": "Intelligent translation API powered by ROMA framework",
        "cost": "$0 - Completely FREE!",
        "endpoints": {
            "translate": "POST /api/v1/translate",
            "detect": "POST /api/v1/detect",
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

