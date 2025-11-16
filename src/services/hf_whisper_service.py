"""
Cloud-based ASR using Whisper via Hugging Face Inference API
Zero downloads, 100% cloud processing
"""
import requests
import os
import hashlib
import json
import time
from typing import Dict, Optional
from datetime import datetime
from dotenv import load_dotenv
from ..utils.logger import get_logger

load_dotenv()
logger = get_logger("hf_whisper_asr")


class HFWhisperASR:
    """Production-ready Whisper ASR service with caching and retry logic"""
    
    def __init__(self, hf_token: Optional[str] = None, enable_cache: bool = True):
        """Initialize HF Whisper ASR service"""
        self.api_url = "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3"
        self.headers = {}
        
        token = hf_token or os.getenv("HF_TOKEN")
        if token:
            self.headers["Authorization"] = f"Bearer {token}"
            logger.info("✅ HF Whisper ASR initialized with token")
        else:
            logger.warning("⚠️  No HF token found. Rate limits will be restricted.")
        
        self.enable_cache = enable_cache
        self.cache = {}
        self.cache_file = "asr_cache.json"
        
        if enable_cache:
            self._load_cache()
    
    def _load_cache(self):
        """Load cache from disk"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    self.cache = json.load(f)
                logger.info(f"📦 Loaded {len(self.cache)} cached transcriptions")
        except Exception as e:
            logger.warning(f"⚠️  Could not load cache: {e}")
    
    def _save_cache(self):
        """Save cache to disk"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"⚠️  Could not save cache: {e}")
    
    def _get_audio_hash(self, audio_path: str) -> str:
        """Generate unique hash for audio file"""
        with open(audio_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    
    def transcribe_audio(self, audio_path: str) -> Dict:
        """Transcribe audio file using HF Inference API"""
        
        # Check cache first
        if self.enable_cache:
            audio_hash = self._get_audio_hash(audio_path)
            if audio_hash in self.cache:
                logger.info("✅ Using cached transcription")
                result = self.cache[audio_hash].copy()
                result["cached"] = True
                return result
        
        try:
            with open(audio_path, "rb") as f:
                audio_bytes = f.read()
            
            logger.info(f"🔊 Transcribing audio ({len(audio_bytes)} bytes)...")
            headers = self.headers.copy()
            headers["Content-Type"] = "audio/ogg"
            response = requests.post(
                self.api_url,
                headers=headers,
                data=audio_bytes,
                timeout=60
            )
            
            if response.status_code == 200:
                result_data = response.json()
                
                result = {
                    "text": result_data.get("text", "").strip(),
                    "success": True,
                    "model": "whisper-large-v3",
                    "cached": False,
                    "timestamp": datetime.now().isoformat()
                }
                
                # Cache successful transcription
                if self.enable_cache:
                    audio_hash = self._get_audio_hash(audio_path)
                    self.cache[audio_hash] = result
                    self._save_cache()
                
                return result
            
            elif response.status_code == 503:
                return {
                    "text": "",
                    "success": False,
                    "error": "Model loading (cold start). Retry in 30s.",
                    "retry": True,
                    "cached": False
                }
            
            elif response.status_code == 429:
                return {
                    "text": "",
                    "success": False,
                    "error": "Rate limit exceeded. Try again in 1 hour.",
                    "retry": False,
                    "cached": False
                }
            
            else:
                return {
                    "text": "",
                    "success": False,
                    "error": f"API error {response.status_code}: {response.text}",
                    "retry": False,
                    "cached": False
                }
        
        except Exception as e:
            return {
                "text": "",
                "success": False,
                "error": str(e),
                "retry": False,
                "cached": False
            }
    
    def transcribe_with_retry(self, audio_path: str, max_retries: int = 3) -> Dict:
        """Transcribe with automatic retry for cold starts"""
        for attempt in range(max_retries):
            result = self.transcribe_audio(audio_path)
            
            if result["success"]:
                logger.info(f"✅ Transcription: '{result['text'][:50]}...'")
                return result
            
            if result.get("retry") and attempt < max_retries - 1:
                wait_time = 30 * (attempt + 1)
                logger.info(f"⏳ Retry {attempt + 1}/{max_retries}: waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            return result
        
        return {"text": "", "success": False, "error": "Max retries exceeded", "cached": False}

    def clear_cache(self):
        """Clear all cached transcriptions"""
        self.cache = {}
        if os.path.exists(self.cache_file):
            os.remove(self.cache_file)
        logger.info("🗑️  Cache cleared")

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return {
            "total_cached": len(self.cache),
            "cache_file": self.cache_file,
            "cache_enabled": self.enable_cache
        }

