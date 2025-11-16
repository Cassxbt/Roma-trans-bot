/**
 * API Health Check Utility
 * Provides diagnostics for backend connectivity and service health
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export type HealthStatus = "healthy" | "degraded" | "offline";

export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  isApiRunning: boolean;
  apiBaseUrl: string;
  isTranslationServiceReady: boolean;
  details?: Record<string, unknown>;
}

/**
 * Check if backend API is running and responding
 */
export async function checkApiHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    console.log(`🏥 Checking API health at ${API_BASE}...`);

    // Test basic connectivity with 5 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE}/`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API is healthy (${duration}ms)`, data);
      return {
        status: "healthy",
        message: "API is running and responsive",
        isApiRunning: true,
        apiBaseUrl: API_BASE,
        isTranslationServiceReady: true,
        details: {
          responseTime: duration,
          apiVersion: data.version,
          endpoints: data.endpoints,
        },
      };
    } else {
      console.warn(`⚠️ API returned ${response.status}`);
      return {
        status: "degraded",
        message: `API returned HTTP ${response.status}`,
        isApiRunning: false,
        apiBaseUrl: API_BASE,
        isTranslationServiceReady: false,
        details: { httpStatus: response.status },
      };
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    let message = "Unknown error";

    if (error.name === "AbortError") {
      message = `API request timed out after ${duration}ms`;
      console.error("⏱️ " + message);
    } else if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      message = `Cannot reach API at ${API_BASE}. Is the backend running?`;
      console.error("❌ " + message);
    } else {
      message = error.message || "Network error";
      console.error("❌ Health check error:", error);
    }

    return {
      status: "offline",
      message,
      isApiRunning: false,
      apiBaseUrl: API_BASE,
      isTranslationServiceReady: false,
      details: { error: error.message },
    };
  }
}

/**
 * Check if a specific endpoint is working
 */
export async function checkEndpoint(endpoint: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: endpoint.includes("POST") ? "POST" : "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get diagnostic information
 */
export function getDiagnostics() {
  return {
    apiBaseUrl: API_BASE,
    expectedEndpoints: {
      health: "GET /api/v1/health",
      translate: "POST /api/v1/translate",
      transcribe: "POST /api/v1/transcribe",
      voiceTranslate: "POST /api/v1/voice-translate",
      detect: "POST /api/v1/detect",
      languages: "GET /api/v1/languages",
    },
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run full diagnostic suite
 */
export async function runFullDiagnostics(): Promise<Record<string, unknown>> {
  console.log("🔍 Running full diagnostics...");

  const health = await checkApiHealth();
  const diagnostics = getDiagnostics();

  return {
    health,
    diagnostics,
    timestamp: new Date().toISOString(),
  };
}
