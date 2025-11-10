"""
Quality Check Executor

Checks translation quality using various metrics
"""

from typing import Dict
from .base import BaseExecutor


class QualityCheckExecutor(BaseExecutor):
    """Checks quality of translations"""
    
    async def execute(
        self,
        source_text: str,
        translations: Dict[str, str],
        source_lang: str
    ) -> Dict[str, float]:
        """
        Calculate quality scores for translations
        
        Args:
            source_text: Original source text
            translations: Dictionary of {language: translation}
            source_lang: Source language code
        
        Returns:
            Dictionary of {language: quality_score}
        """
        quality_scores = {}
        source_len = len(source_text.split())
        
        for lang, translation in translations.items():
            trans_len = len(translation.split())
            
            if source_len == 0:
                quality_scores[lang] = 0.5
                continue
            
            ratio = trans_len / source_len
            
            # Good translations typically have 0.8-1.5x word count
            # Score based on how close to 1.0 the ratio is
            if 0.5 <= ratio <= 2.0:
                # Score: 0.6 base + bonus for being close to 1.0
                score = 0.6 + (0.3 * (1.0 - abs(1.0 - ratio)))
                quality_scores[lang] = min(0.9, score)
            else:
                # Ratio too far from expected, lower score
                quality_scores[lang] = 0.5
        
        return quality_scores

