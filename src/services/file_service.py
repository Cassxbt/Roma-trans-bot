"""
File Service

Handle file operations for translation (PDF, DOCX, TXT, etc.)
"""

import os
from pathlib import Path
from typing import Optional
import PyPDF2
import docx
import chardet


class FileService:
    """Service for handling file operations"""
    
    def __init__(self):
        self.upload_dir = Path(os.getenv("UPLOAD_DIR", "data/uploads"))
        self.max_size = int(os.getenv("MAX_UPLOAD_SIZE", 10485760))  # 10MB default
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def read_text_file(self, file_path: str) -> str:
        """
        Read text from a text file
        
        Args:
            file_path: Path to text file
        
        Returns:
            File contents as string
        """
        # Detect encoding
        with open(file_path, 'rb') as f:
            raw_data = f.read()
            result = chardet.detect(raw_data)
            encoding = result['encoding'] or 'utf-8'
        
        # Read with detected encoding
        with open(file_path, 'r', encoding=encoding) as f:
            return f.read()
    
    def read_pdf(self, file_path: str) -> str:
        """
        Extract text from PDF file
        
        Args:
            file_path: Path to PDF file
        
        Returns:
            Extracted text
        """
        text = []
        with open(file_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            for page in pdf_reader.pages:
                text.append(page.extract_text())
        
        return '\n'.join(text)
    
    def read_docx(self, file_path: str) -> str:
        """
        Extract text from DOCX file
        
        Args:
            file_path: Path to DOCX file
        
        Returns:
            Extracted text
        """
        doc = docx.Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs]
        return '\n'.join(paragraphs)
    
    def read_file(self, file_path: str) -> str:
        """
        Read file based on extension
        
        Args:
            file_path: Path to file
        
        Returns:
            File contents as string
        """
        path = Path(file_path)
        extension = path.suffix.lower()
        
        # Check file size
        file_size = path.stat().st_size
        if file_size > self.max_size:
            raise ValueError(f"File too large. Maximum size: {self.max_size} bytes")
        
        if extension == '.pdf':
            return self.read_pdf(file_path)
        elif extension in ['.docx', '.doc']:
            return self.read_docx(file_path)
        elif extension in ['.txt', '.md', '.text']:
            return self.read_text_file(file_path)
        else:
            # Try as text file
            return self.read_text_file(file_path)
    
    def save_file(self, content: str, file_path: str) -> str:
        """
        Save content to file
        
        Args:
            content: Content to save
            file_path: Path to save file
        
        Returns:
            Path to saved file
        """
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(path)
    
    def get_file_info(self, file_path: str) -> dict:
        """
        Get file information
        
        Args:
            file_path: Path to file
        
        Returns:
            Dictionary with file info
        """
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        return {
            "name": path.name,
            "size": path.stat().st_size,
            "extension": path.suffix,
            "path": str(path)
        }

