"""
Base Executor

Base class for all executors
"""

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseExecutor(ABC):
    """Base class for all executors"""
    
    @abstractmethod
    async def execute(self, *args, **kwargs) -> Any:
        """Execute the task"""
        pass

