"""Unit tests for cache service"""

import pytest
from src.services.cache_service import SimpleCacheService


def test_cache_set_get():
    """Test cache set and get operations"""
    cache = SimpleCacheService(ttl=3600)
    
    cache.set("Hello", "en", "es", "Hola")
    result = cache.get("Hello", "en", "es")
    
    assert result == "Hola"


def test_cache_miss():
    """Test cache miss scenario"""
    cache = SimpleCacheService(ttl=3600)
    
    result = cache.get("Hello", "en", "fr")
    
    assert result is None


def test_cache_expiration():
    """Test cache expiration"""
    cache = SimpleCacheService(ttl=0)  # Immediate expiration
    
    cache.set("Hello", "en", "es", "Hola")
    result = cache.get("Hello", "en", "es")
    
    # Should be None due to expiration
    assert result is None

