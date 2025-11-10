"""
Database Service

SQLite database operations for translation storage and translation memory
"""

import aiosqlite
import os
import hashlib
from typing import Optional, List, Dict
from pathlib import Path
from ..core.config_loader import get_config_loader


class DatabaseService:
    """FREE SQLite database - no PostgreSQL needed!"""
    
    def __init__(self):
        self.config_loader = get_config_loader()
        db_config = self.config_loader.get_config().get("database", {})
        
        db_path = os.getenv("DATABASE_URL", db_config.get("path", "data/translations.db"))
        # Remove sqlite:/// prefix if present
        if db_path.startswith("sqlite:///"):
            db_path = db_path.replace("sqlite:///", "")
        
        self.db_path = db_path
        
        # Ensure data directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
    
    async def initialize(self):
        """Create tables if they don't exist"""
        async with aiosqlite.connect(self.db_path) as db:
            # Translations table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS translations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_text TEXT NOT NULL,
                    source_lang TEXT NOT NULL,
                    target_lang TEXT NOT NULL,
                    translation TEXT NOT NULL,
                    quality_score REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Translation memory table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS translation_memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_hash TEXT UNIQUE NOT NULL,
                    source_text TEXT NOT NULL,
                    source_lang TEXT NOT NULL,
                    target_lang TEXT NOT NULL,
                    translation TEXT NOT NULL,
                    usage_count INTEGER DEFAULT 1,
                    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create index for faster lookups
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_translation_memory_hash 
                ON translation_memory(source_hash, source_lang, target_lang)
            """)
            
            await db.commit()
            print("✅ SQLite database initialized (FREE!)")
    
    async def save_translation(
        self,
        source_text: str,
        source_lang: str,
        target_lang: str,
        translation: str,
        quality_score: Optional[float] = None
    ):
        """Save translation for analytics"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO translations 
                (source_text, source_lang, target_lang, translation, quality_score)
                VALUES (?, ?, ?, ?, ?)
                """,
                (source_text, source_lang, target_lang, translation, quality_score)
            )
            await db.commit()
    
    async def save_to_memory(
        self,
        source_text: str,
        source_lang: str,
        target_lang: str,
        translation: str
    ):
        """Save translation to memory for future use"""
        text_hash = hashlib.md5(source_text.encode()).hexdigest()
        
        async with aiosqlite.connect(self.db_path) as db:
            # Check if exists
            async with db.execute(
                """
                SELECT id, usage_count FROM translation_memory
                WHERE source_hash = ? AND source_lang = ? AND target_lang = ?
                """,
                (text_hash, source_lang, target_lang)
            ) as cursor:
                row = await cursor.fetchone()
                
                if row:
                    # Update existing entry
                    await db.execute(
                        """
                        UPDATE translation_memory
                        SET usage_count = usage_count + 1,
                            last_used = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """,
                        (row[0],)
                    )
                else:
                    # Insert new entry
                    await db.execute(
                        """
                        INSERT INTO translation_memory
                        (source_hash, source_text, source_lang, target_lang, translation)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (text_hash, source_text, source_lang, target_lang, translation)
                    )
            
            await db.commit()
    
    async def get_from_memory(
        self,
        source_text: str,
        source_lang: str,
        target_lang: str
    ) -> Optional[str]:
        """Get cached translation from memory"""
        text_hash = hashlib.md5(source_text.encode()).hexdigest()
        
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                """
                SELECT translation FROM translation_memory
                WHERE source_hash = ? AND source_lang = ? AND target_lang = ?
                """,
                (text_hash, source_lang, target_lang)
            ) as cursor:
                row = await cursor.fetchone()
                
                if row:
                    # Update usage count
                    await db.execute(
                        """
                        UPDATE translation_memory
                        SET usage_count = usage_count + 1,
                            last_used = CURRENT_TIMESTAMP
                        WHERE source_hash = ? AND source_lang = ? AND target_lang = ?
                        """,
                        (text_hash, source_lang, target_lang)
                    )
                    await db.commit()
                    return row[0]
        
        return None
    
    async def get_translation_stats(self) -> Dict:
        """Get statistics about translations"""
        async with aiosqlite.connect(self.db_path) as db:
            # Total translations
            async with db.execute("SELECT COUNT(*) FROM translations") as cursor:
                total_translations = (await cursor.fetchone())[0]
            
            # Translation memory size
            async with db.execute("SELECT COUNT(*) FROM translation_memory") as cursor:
                memory_size = (await cursor.fetchone())[0]
            
            # Most used translations
            async with db.execute(
                """
                SELECT source_text, target_lang, usage_count
                FROM translation_memory
                ORDER BY usage_count DESC
                LIMIT 5
                """
            ) as cursor:
                top_translations = await cursor.fetchall()
            
            return {
                "total_translations": total_translations,
                "translation_memory_size": memory_size,
                "top_translations": [
                    {
                        "text": row[0][:50] + "..." if len(row[0]) > 50 else row[0],
                        "target_lang": row[1],
                        "usage_count": row[2]
                    }
                    for row in top_translations
                ]
            }

