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

        # Get provider info from translation service
        provider_name = "Multi-Provider"
        if hasattr(bot, 'translation_service') and bot.translation_service.enabled_providers:
            provider_name = bot.translation_service.enabled_providers[0].name

        return HealthResponse(
            status="healthy",
            provider=provider_name,
            model="ROMA Framework",
            cost="$0 - FREE forever!",
            limits={
                "max_text_length": 10000,
                "max_languages": 10,
                "providers": len(bot.translation_service.enabled_providers) if hasattr(bot, 'translation_service') else 0
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

