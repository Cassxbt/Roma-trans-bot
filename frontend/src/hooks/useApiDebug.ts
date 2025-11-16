/**
 * useApiDebug Hook
 * Provides debugging utilities for API issues in React components
 */

import { useEffect, useState } from "react";
import { checkApiHealth, HealthCheckResult, runFullDiagnostics } from "../api/health";

interface DebugInfo {
  health: HealthCheckResult | null;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useApiDebug(autoCheck = false) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    health: null,
    isLoading: false,
    error: null,
    lastChecked: null,
  });

  const performHealthCheck = async () => {
    setDebugInfo((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const health = await checkApiHealth();
      setDebugInfo((prev) => ({
        ...prev,
        health,
        lastChecked: new Date(),
        isLoading: false,
      }));
      return health;
    } catch (err: any) {
      const error = err.message || "Health check failed";
      setDebugInfo((prev) => ({
        ...prev,
        error,
        isLoading: false,
      }));
      return null;
    }
  };

  const getDiagnosticInfo = async () => {
    try {
      const diagnostics = await runFullDiagnostics();
      console.log("📋 Diagnostic Report:", diagnostics);
      return diagnostics;
    } catch (err: any) {
      console.error("Diagnostic error:", err);
      return null;
    }
  };

  const logDebugInfo = () => {
    console.group("🔧 API Debug Info");
    console.log("Health Status:", debugInfo.health?.status);
    console.log("API Running:", debugInfo.health?.isApiRunning);
    console.log("API URL:", debugInfo.health?.apiBaseUrl);
    console.log("Last Checked:", debugInfo.lastChecked);
    if (debugInfo.error) console.error("Error:", debugInfo.error);
    console.groupEnd();
  };

  // Auto-check on mount if enabled
  useEffect(() => {
    if (autoCheck) {
      performHealthCheck();
    }
  }, [autoCheck]);

  return {
    ...debugInfo,
    performHealthCheck,
    getDiagnosticInfo,
    logDebugInfo,
  };
}

/**
 * Hook to handle API errors with retry logic
 */
export function useApiErrorHandler() {
  const classifyError = (error: Error | string): {
    type: "network" | "client" | "server" | "unknown";
    retryable: boolean;
    message: string;
  } => {
    const errorStr =
      typeof error === "string" ? error : error.message || error.toString();

    if (errorStr.includes("Failed to fetch")) {
      return {
        type: "network",
        retryable: true,
        message:
          "Network error: Cannot reach the server. Please check your connection.",
      };
    }

    if (errorStr.includes("timeout")) {
      return {
        type: "network",
        retryable: true,
        message:
          "Request timed out. The server is taking too long to respond.",
      };
    }

    if (errorStr.includes("HTTP 4")) {
      return {
        type: "client",
        retryable: false,
        message: "Invalid request: Please check your input and try again.",
      };
    }

    if (errorStr.includes("HTTP 5")) {
      return {
        type: "server",
        retryable: true,
        message:
          "Server error: The translation service encountered an issue. Retrying...",
      };
    }

    if (errorStr.includes("CORS")) {
      return {
        type: "network",
        retryable: false,
        message:
          "CORS error: Frontend and backend are not properly configured.",
      };
    }

    return {
      type: "unknown",
      retryable: false,
      message: "An unknown error occurred. Please try again.",
    };
  };

  const formatErrorForUser = (error: Error | string): string => {
    const { message } = classifyError(error);
    return message;
  };

  const shouldRetry = (
    error: Error | string,
    attemptCount: number,
    maxAttempts: number = 3
  ): boolean => {
    const { retryable } = classifyError(error);
    return retryable && attemptCount < maxAttempts;
  };

  return {
    classifyError,
    formatErrorForUser,
    shouldRetry,
  };
}
