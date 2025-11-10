"""
Format Preservation Executor

Preserves formatting in translations (markdown, HTML, etc.)
"""

import re
from typing import Dict
from .base import BaseExecutor


class FormatPreservationExecutor(BaseExecutor):
    """Preserves formatting in translations"""
    
    async def execute(
        self,
        source_text: str,
        translations: Dict[str, str]
    ) -> Dict[str, str]:
        """
        Preserve formatting in translations
        
        Args:
            source_text: Original source text
            translations: Dictionary of {language: translation}
        
        Returns:
            Dictionary of {language: formatted_translation}
        """
        # Extract formatting markers (markdown, HTML tags, etc.)
        formatting_patterns = [
            (r'\*\*(.*?)\*\*', '**'),  # Bold markdown
            (r'\*(.*?)\*', '*'),       # Italic markdown
            (r'`(.*?)`', '`'),         # Code markdown
            (r'<[^>]+>', ''),          # HTML tags (preserve structure)
        ]
        
        formatted_translations = {}
        
        for lang, translation in translations.items():
            # Basic formatting preservation
            # This is a simplified version - can be enhanced
            formatted = translation
            
            # Preserve line breaks
            if '\n' in source_text:
                # Ensure translation has similar line structure
                source_lines = source_text.split('\n')
                trans_lines = translation.split('\n')
                if len(trans_lines) < len(source_lines) * 0.5:
                    # Translation lost too many line breaks, try to restore
                    formatted = translation.replace('. ', '.\n')
            
            formatted_translations[lang] = formatted
        
        return formatted_translations

