#!/usr/bin/env python3
"""Run the FastAPI server"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8001))
    host = os.getenv("API_HOST", "0.0.0.0")
    
    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=False
    )

