"""
Health Routes

API routes for health check and status
"""

from fastapi import APIRouter
from ...core.translation_agent import TranslationBot
from ..models.response import HealthResponse

router = APIRouter(prefix="/api/v1", tags=["health"])

# Initialize bot (will be initialized once)
_bot: TranslationBot = None


def get_bot() -> TranslationBot:
    """Get or create bot instance"""
    global _bot
    if _bot is None:
        _bot = TranslationBot()
    return _bot


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        bot = get_bot()
        stats = bot.get_stats()
        
        return HealthResponse(
            status="healthy",
            provider=bot.llm.provider,
            model=bot.llm.model,
            cost="$0 - FREE forever!",
            limits={
                "max_text_length": 10000,
                "max_languages": 5,
                "rate_limit": "1000 req/day (Hugging Face free tier)"
            }
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            provider="unknown",
            model="unknown",
            cost="$0 - FREE forever!",
            limits={"error": str(e)}
        )

