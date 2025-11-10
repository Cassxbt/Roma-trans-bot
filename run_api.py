#!/usr/bin/env python3
"""Run the FastAPI server"""

import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 5000))
    host = os.getenv("API_HOST", "0.0.0.0")
    
    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=True
    )

