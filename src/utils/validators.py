"""
Validators

Input validation utilities
"""

from typing import List, Optional
from ..core.config_loader import get_config_loader


def validate_text_length(text: str, max_length: Optional[int] = None) -> bool:
    """
    Validate text length
    
    Args:
        text: Text to validate
        max_length: Maximum allowed length
    
    Returns:
        True if valid
    """
    if max_length is None:
        config_loader = get_config_loader()
        max_length = config_loader.get_config().get("translation", {}).get("max_text_length", 10000)
    
    return len(text) <= max_length


def validate_languages(languages: List[str]) -> bool:
    """
    Validate language codes
    
    Args:
        languages: List of language codes
    
    Returns:
        True if all languages are valid
    """
    config_loader = get_config_loader()
    supported_languages = config_loader.get_languages()
    
    for lang in languages:
        if lang not in supported_languages:
            return False
    
    return True


def validate_target_languages_count(languages: List[str]) -> bool:
    """
    Validate number of target languages
    
    Args:
        languages: List of target languages
    
    Returns:
        True if count is within limits
    """
    config_loader = get_config_loader()
    max_langs = config_loader.get_config().get("translation", {}).get("max_target_languages", 5)
    
    return len(languages) <= max_langs

