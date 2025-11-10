#!/usr/bin/env python3
"""Initialize SQLite database"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.services.database_service import DatabaseService


async def main():
    print("🗄️  Setting up SQLite database...")
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Initialize database
    db = DatabaseService()
    await db.initialize()
    
    print("✅ Database initialized!")
    print("💰 Cost: $0 - FREE forever!")
    print(f"📁 Location: {db.db_path}")


if __name__ == "__main__":
    asyncio.run(main())

