"""
Voice Translation API Routes

Endpoints for voice transcription and voice-to-translation workflow
"""

import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from ...services.hf_whisper_service import HFWhisperASR
from ...core.translation_agent import TranslationBot
from ...utils.logger import get_logger

logger = get_logger("voice_api")

router = APIRouter(prefix="/api/v1", tags=["voice"])

# Initialize services
asr = HFWhisperASR(enable_cache=True)
translation_bot = TranslationBot()


@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
) -> dict:
    """
    Transcribe audio file to text using Whisper
    
    Args:
        file: Audio file (WAV, MP3, M4A, FLAC, OGG, OPUS)
    
    Returns:
        {
            "text": "transcribed text",
            "success": bool,
            "model": "whisper-large-v3",
            "cached": bool,
            "timestamp": "ISO timestamp"
        }
    """
    try:
        # Validate file format
        valid_formats = ('.wav', '.mp3', '.m4a', '.flac', '.ogg', '.opus', '.webm')
        filename = file.filename.lower()
        if not any(filename.endswith(fmt) for fmt in valid_formats):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format. Supported: WAV, MP3, M4A, FLAC, OGG, OPUS, WEBM"
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(
            suffix=os.path.splitext(filename)[1],
            delete=False
        ) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Transcribe
            result = asr.transcribe_with_retry(tmp_file_path)
            
            if not result.get("success"):
                logger.warning(f"Transcription failed: {result.get('error')}")
                raise HTTPException(
                    status_code=400,
                    detail=result.get("error", "Transcription failed")
                )
            
            logger.info(f"✅ Transcribed {len(result['text'])} chars")
            return result
        
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice-translate")
async def voice_translate(
    file: UploadFile = File(...),
    target_languages: str = Form(...),
    source_language: Optional[str] = Form(None),
    preserve_formatting: bool = Form(True),
) -> dict:
    """
    Full voice-to-text-to-translation pipeline
    
    Args:
        file: Audio file
        target_languages: Comma-separated language codes (e.g., "es,fr,de")
        source_language: Optional source language code
        preserve_formatting: Whether to preserve formatting
    
    Returns:
        {
            "request_id": "unique_id",
            "transcribed_text": "what was spoken",
            "source_language": "detected or provided",
            "translations": { "es": "...", "fr": "...", ... },
            "quality_scores": { "es": 0.95, ... },
            "cached_transcription": bool,
            "processing_time_ms": 1234
        }
    """
    import time
    import uuid
    
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    try:
        # Parse target languages
        try:
            target_langs = [
                lang.strip().lower()
                for lang in target_languages.split(',')
                if lang.strip()
            ]
            if not target_langs:
                raise ValueError("No target languages provided")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid language format: {str(e)}")
        
        # Validate file format
        valid_formats = ('.wav', '.mp3', '.m4a', '.flac', '.ogg', '.opus', '.webm')
        filename = file.filename.lower()
        if not any(filename.endswith(fmt) for fmt in valid_formats):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format. Supported: WAV, MP3, M4A, FLAC, OGG, OPUS, WEBM"
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(
            suffix=os.path.splitext(filename)[1],
            delete=False
        ) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Step 1: Transcribe audio
            logger.info(f"[{request_id}] Starting transcription...")
            asr_result = asr.transcribe_with_retry(tmp_file_path)
            
            if not asr_result.get("success"):
                raise HTTPException(
                    status_code=400,
                    detail=asr_result.get("error", "Transcription failed")
                )
            
            transcribed_text = asr_result["text"]
            cached_transcription = asr_result.get("cached", False)
            logger.info(f"[{request_id}] ✅ Transcribed: {transcribed_text[:50]}...")
            
            # Step 2: Translate text
            logger.info(f"[{request_id}] Starting translation to {len(target_langs)} languages...")
            translation_result = await translation_bot.translate(
                text=transcribed_text,
                target_languages=target_langs,
                source_language=source_language,
                preserve_formatting=preserve_formatting
            )
            
            if translation_result.get("error"):
                raise HTTPException(
                    status_code=400,
                    detail=translation_result["error"]
                )
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.info(f"[{request_id}] ✅ Complete in {elapsed_ms}ms")
            
            return {
                "request_id": request_id,
                "transcribed_text": transcribed_text,
                "source_language": translation_result.get("source_language"),
                "translations": translation_result.get("translations", {}),
                "quality_scores": translation_result.get("quality_scores", {}),
                "cached_transcription": cached_transcription,
                "processing_time_ms": elapsed_ms,
                "metadata": {
                    "audio_file": file.filename,
                    "target_languages": target_langs,
                    "model": "whisper-large-v3 + ROMA"
                }
            }
        
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Voice translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
