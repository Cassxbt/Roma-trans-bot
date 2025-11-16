"""CLI Entry Point"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
project_root = Path(__file__).parent.parent.parent
env_path = project_root / '.env'

if env_path.exists():
    load_dotenv(env_path)
    logger.info(f"✅ Loaded environment from {env_path}")
else:
    logger.warning(f"⚠️  .env file not found at {env_path}")
    logger.info("   Please create .env file with HUGGINGFACE_API_KEY")

from .commands import cli

if __name__ == '__main__':
    cli()
