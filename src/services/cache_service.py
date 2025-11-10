"""
Cache Service

In-memory cache for translations
"""

from typing import Optional, Dict
import hashlib
import time
import os
from ..core.config_loader import get_config_loader


class SimpleCacheService:
    """FREE in-memory cache - no Redis needed!"""
    
    def __init__(self, ttl: Optional[int] = None):
        self.config_loader = get_config_loader()
        cache_config = self.config_loader.get_config().get("cache", {})
        
        self.cache: Dict[str, tuple] = {}  # key: (value, timestamp)
        self.ttl = ttl or int(os.getenv("CACHE_TTL", cache_config.get("ttl", 86400)))
        self.enabled = os.getenv("CACHE_ENABLED", "true").lower() == "true"
        
        if self.enabled:
            print("✅ Using in-memory cache (FREE!)")
    
    def _make_key(
        self,
        text: str,
        source_lang: str,
        target_lang: str
    ) -> str:
        """Create cache key"""
        content = f"{text}:{source_lang}:{target_lang}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get(
        self,
        text: str,
        source_lang: str,
        target_lang: str
    ) -> Optional[str]:
        """Get cached translation"""
        if not self.enabled:
            return None
        
        key = self._make_key(text, source_lang, target_lang)
        
        if key in self.cache:
            value, timestamp = self.cache[key]
            
            # Check if expired
            if time.time() - timestamp < self.ttl:
                return value
            else:
                # Expired, remove
                del self.cache[key]
        
        return None
    
    def set(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        translation: str
    ):
        """Cache translation"""
        if not self.enabled:
            return
        
        key = self._make_key(text, source_lang, target_lang)
        self.cache[key] = (translation, time.time())
    
    def clear_expired(self):
        """Periodically clear expired entries"""
        if not self.enabled:
            return
        
        current_time = time.time()
        expired_keys = [
            k for k, (v, t) in self.cache.items()
            if current_time - t >= self.ttl
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            print(f"🧹 Cleared {len(expired_keys)} expired cache entries")
    
    def clear_all(self):
        """Clear all cache entries"""
        self.cache.clear()
        print("🧹 Cleared all cache entries")
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        current_time = time.time()
        active_entries = sum(
            1 for _, (_, t) in self.cache.items()
            if current_time - t < self.ttl
        )
        
        return {
            "total_entries": len(self.cache),
            "active_entries": active_entries,
            "expired_entries": len(self.cache) - active_entries,
            "ttl_seconds": self.ttl,
            "enabled": self.enabled
        }

