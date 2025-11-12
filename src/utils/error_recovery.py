"""
Error Recovery & Retry Logic

Implements exponential backoff, circuit breaker, and retry strategies
for reliable error handling and provider failover.
"""

import asyncio
import time
from typing import Callable, Any, Dict, Optional
from functools import wraps
from enum import Enum
from ..utils.logger import get_logger

logger = get_logger(__name__)


class RetryStrategy(Enum):
    """Retry strategy types"""
    EXPONENTIAL = "exponential"
    LINEAR = "linear"
    FIXED = "fixed"


class CircuitBreakerState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"           # Normal operation
    OPEN = "open"              # Failing, reject requests
    HALF_OPEN = "half_open"    # Testing if recovered


class CircuitBreaker:
    """
    Circuit Breaker Pattern Implementation
    
    Prevents cascading failures by stopping requests to failing services.
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        success_threshold: int = 2
    ):
        """
        Initialize circuit breaker
        
        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds before attempting recovery
            success_threshold: Successes needed to close circuit
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        
    async def call(
        self,
        func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """
        Execute function through circuit breaker
        
        Args:
            func: Function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments
        
        Returns:
            Function result
        
        Raises:
            Exception: If circuit is open or function fails
        """
        if self.state == CircuitBreakerState.OPEN:
            # Check if recovery timeout has passed
            if time.time() - self.last_failure_time > self.recovery_timeout:
                logger.info(f"Circuit breaker for {func.__name__} attempting recovery")
                self.state = CircuitBreakerState.HALF_OPEN
                self.success_count = 0
            else:
                raise Exception(
                    f"Circuit breaker OPEN for {func.__name__}. "
                    f"Service unavailable. Retry in {self.recovery_timeout}s"
                )
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0
        
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                logger.info("Circuit breaker CLOSED - service recovered")
                self.state = CircuitBreakerState.CLOSED
                self.success_count = 0
    
    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            logger.warning(
                f"Circuit breaker OPEN after {self.failure_count} failures"
            )
            self.state = CircuitBreakerState.OPEN
            self.success_count = 0


def retry_async(
    max_retries: int = 3,
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,),
    on_retry: Optional[Callable] = None
):
    """
    Async retry decorator with exponential backoff
    
    Args:
        max_retries: Maximum number of retries
        strategy: Retry strategy (exponential, linear, fixed)
        base_delay: Initial delay between retries
        max_delay: Maximum delay between retries
        backoff_factor: Multiplier for exponential backoff
        exceptions: Tuple of exceptions to catch
        on_retry: Callback on retry
    
    Example:
        @retry_async(max_retries=3)
        async def call_api():
            return await api.request()
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt < max_retries:
                        # Calculate delay
                        if strategy == RetryStrategy.EXPONENTIAL:
                            delay = min(
                                base_delay * (backoff_factor ** attempt),
                                max_delay
                            )
                        elif strategy == RetryStrategy.LINEAR:
                            delay = min(
                                base_delay * (attempt + 1),
                                max_delay
                            )
                        else:  # FIXED
                            delay = base_delay
                        
                        logger.warning(
                            f"{func.__name__} attempt {attempt + 1}/{max_retries + 1} failed: {str(e)}. "
                            f"Retrying in {delay:.1f}s"
                        )
                        
                        if on_retry:
                            on_retry(attempt, delay, e)
                        
                        await asyncio.sleep(delay)
                    else:
                        logger.error(
                            f"{func.__name__} failed after {max_retries} retries: {str(e)}"
                        )
            
            raise last_exception
        
        return wrapper
    return decorator


class RetryableOperation:
    """
    Wrapper for retryable operations with detailed tracking
    """
    
    def __init__(self, name: str):
        self.name = name
        self.total_attempts = 0
        self.successful_attempts = 0
        self.failed_attempts = 0
        self.last_error: Optional[str] = None
        self.total_retry_time = 0.0
    
    async def execute(
        self,
        func: Callable,
        *args,
        max_retries: int = 3,
        strategy: RetryStrategy = RetryStrategy.EXPONENTIAL,
        base_delay: float = 1.0,
        **kwargs
    ) -> Any:
        """
        Execute function with automatic retries
        
        Args:
            func: Async function to execute
            *args: Function arguments
            max_retries: Maximum retry attempts
            strategy: Retry strategy
            base_delay: Initial delay
            **kwargs: Function keyword arguments
        
        Returns:
            Function result
        """
        start_time = time.time()
        
        for attempt in range(max_retries + 1):
            self.total_attempts += 1
            
            try:
                result = await func(*args, **kwargs)
                self.successful_attempts += 1
                return result
                
            except Exception as e:
                self.failed_attempts += 1
                self.last_error = str(e)
                
                if attempt < max_retries:
                    # Calculate delay
                    if strategy == RetryStrategy.EXPONENTIAL:
                        delay = min(base_delay * (2 ** attempt), 60.0)
                    elif strategy == RetryStrategy.LINEAR:
                        delay = min(base_delay * (attempt + 1), 60.0)
                    else:
                        delay = base_delay
                    
                    logger.warning(
                        f"{self.name} attempt {attempt + 1}/{max_retries + 1} failed. "
                        f"Error: {str(e)}. Retrying in {delay:.1f}s"
                    )
                    
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"{self.name} failed after {max_retries} retries. "
                        f"Final error: {str(e)}"
                    )
                    raise
        
        self.total_retry_time = time.time() - start_time
    
    def get_stats(self) -> Dict[str, Any]:
        """Get operation statistics"""
        return {
            "name": self.name,
            "total_attempts": self.total_attempts,
            "successful": self.successful_attempts,
            "failed": self.failed_attempts,
            "success_rate": (
                self.successful_attempts / self.total_attempts
                if self.total_attempts > 0 else 0
            ),
            "last_error": self.last_error,
            "total_retry_time": f"{self.total_retry_time:.2f}s"
        }


# Predefined circuit breakers for translation providers
translation_circuit_breakers: Dict[str, CircuitBreaker] = {
    "deepl": CircuitBreaker(failure_threshold=5, recovery_timeout=60),
    "azure": CircuitBreaker(failure_threshold=5, recovery_timeout=60),
    "libretranslate": CircuitBreaker(failure_threshold=5, recovery_timeout=60),
}


def get_circuit_breaker(provider_name: str) -> CircuitBreaker:
    """Get or create circuit breaker for provider"""
    if provider_name not in translation_circuit_breakers:
        translation_circuit_breakers[provider_name] = CircuitBreaker()
    return translation_circuit_breakers[provider_name]


async def reset_circuit_breakers():
    """Reset all circuit breakers (useful for recovery)"""
    for breaker in translation_circuit_breakers.values():
        breaker.state = CircuitBreakerState.CLOSED
        breaker.failure_count = 0
        breaker.success_count = 0
    logger.info("All circuit breakers reset")
