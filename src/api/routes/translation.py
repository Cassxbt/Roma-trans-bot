"""
Translation Routes

API routes for translation endpoints
"""

from fastapi import APIRouter, HTTPException
from ...core.translation_agent import TranslationBot
from ..models.request import TranslationRequest, LanguageDetectionRequest
from ..models.response import TranslationResponse, LanguageDetectionResponse

router = APIRouter(prefix="/api/v1", tags=["translation"])

# Initialize bot (will be initialized once)
_bot: TranslationBot = None


def get_bot() -> TranslationBot:
    """Get or create bot instance"""
    global _bot
    if _bot is None:
        _bot = TranslationBot()
    return _bot


@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Translate text to multiple languages
    
    Uses Hugging Face free tier (1000 requests/day)
    """
    try:
        bot = get_bot()
        
        result = await bot.translate(
            text=request.text,
            target_languages=request.target_languages,
            source_language=request.source_language,
            preserve_formatting=request.preserve_formatting
        )
        
        return TranslationResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect", response_model=LanguageDetectionResponse)
async def detect_language(request: LanguageDetectionRequest):
    """Detect language of text"""
    try:
        bot = get_bot()
        lang = await bot.detect_language(request.text)
        
        return LanguageDetectionResponse(
            language=lang,
            text=request.text
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/languages")
async def get_languages():
    """List supported languages"""
    from ...core.config_loader import get_config_loader
    
    config_loader = get_config_loader()
    languages_dict = config_loader.get_languages()
    
    languages_list = [
        {
            "code": code,
            "name": info.get("name", code),
            "native_name": info.get("native_name", "")
        }
        for code, info in languages_dict.items()
    ]
    
    return {
        "languages": languages_list,
        "total": len(languages_list),
        "cost": "$0 - Completely FREE!"
    }

