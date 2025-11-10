"""
Configuration Loader

Loads configuration from YAML files and environment variables
"""

import os
import yaml
from typing import Dict, Any, Optional
from pathlib import Path


class ConfigLoader:
    """Load and manage configuration"""
    
    def __init__(self, config_dir: str = "config"):
        self.config_dir = Path(config_dir)
        self._config_cache: Dict[str, Any] = {}
    
    def load_yaml(self, filename: str, force_reload: bool = False) -> Dict[str, Any]:
        """Load YAML configuration file"""
        if filename in self._config_cache and not force_reload:
            return self._config_cache[filename]
        
        filepath = self.config_dir / filename
        if not filepath.exists():
            return {}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f) or {}
        
        self._config_cache[filename] = config
        return config
    
    def reload_config(self):
        """Clear cache and reload all configs"""
        self._config_cache.clear()
    
    def get_languages(self) -> Dict[str, Dict[str, str]]:
        """Get language configuration"""
        config = self.load_yaml("languages.yaml")
        return config.get("languages", {})
    
    def get_model_config(self) -> Dict[str, Any]:
        """Get model configuration"""
        return self.load_yaml("models.yaml")
    
    def get_agent_config(self) -> Dict[str, Any]:
        """Get agent configuration"""
        return self.load_yaml("agent_config.yaml")
    
    def get_env_var(self, key: str, default: Any = None) -> Any:
        """Get environment variable with type conversion"""
        value = os.getenv(key, default)
        
        # Try to convert to appropriate type
        if value is None:
            return default
        
        # Boolean conversion
        if isinstance(default, bool):
            return str(value).lower() in ('true', '1', 'yes', 'on')
        
        # Integer conversion
        if isinstance(default, int):
            try:
                return int(value)
            except ValueError:
                return default
        
        # Float conversion
        if isinstance(default, float):
            try:
                return float(value)
            except ValueError:
                return default
        
        return value
    
    def get_config(self) -> Dict[str, Any]:
        """Get complete configuration"""
        agent_config = self.get_agent_config()
        
        # Override with environment variables
        config = {
            "roma": agent_config.get("roma", {}),
            "translation": {
                **agent_config.get("translation", {}),
                "max_text_length": self.get_env_var(
                    "MAX_TEXT_LENGTH",
                    agent_config.get("translation", {}).get("max_text_length", 10000)
                ),
                "max_target_languages": self.get_env_var(
                    "MAX_TARGET_LANGUAGES",
                    agent_config.get("translation", {}).get("max_target_languages", 10)
                ),
            },
            "cache": {
                **agent_config.get("cache", {}),
                "enabled": self.get_env_var(
                    "CACHE_ENABLED",
                    agent_config.get("cache", {}).get("enabled", True)
                ),
                "ttl": self.get_env_var(
                    "CACHE_TTL",
                    agent_config.get("cache", {}).get("ttl", 86400)
                ),
            },
            "database": agent_config.get("database", {}),
            "languages": self.get_languages(),
            "models": self.get_model_config(),
        }
        
        return config


# Global config loader instance
_config_loader: Optional[ConfigLoader] = None


def get_config_loader(config_dir: str = "config") -> ConfigLoader:
    """Get or create global config loader instance"""
    global _config_loader
    if _config_loader is None:
        _config_loader = ConfigLoader(config_dir)
    return _config_loader

