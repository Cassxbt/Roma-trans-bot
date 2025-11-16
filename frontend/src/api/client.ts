const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
const REQUEST_TIMEOUT = 60000; // 60 seconds for file uploads

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

export type TranslationResponse = {
  request_id: string;
  source_language: string;
  translations: Record<string, string>;
  quality_scores: Record<string, number>;
  processing_time_ms: number;
  cached: boolean;
  metadata: Record<string, unknown>;
};

export type DetectResponse = {
  language: string;
  text: string;
  confidence: number;
};

export type LanguagesResponse = {
  languages: { code: string; name: string; native_name: string }[];
  total: number;
  cost: string;
};

export type HealthResponse = {
  status: string;
  provider: string;
  model: string;
  cost: string;
  limits: Record<string, unknown>;
};

export type VoiceTranslateResponse = {
  request_id: string;
  transcribed_text: string;
  source_language: string;
  translations: Record<string, string>;
  quality_scores: Record<string, number>;
  cached_transcription: boolean;
  processing_time_ms: number;
  metadata: Record<string, unknown>;
};

export type TranscribeResponse = {
  text: string;
  success: boolean;
  model: string;
  cached: boolean;
  timestamp: string;
  error?: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async translate(input: {
    text: string;
    target_languages: string[];
    source_language?: string | null;
    preserve_formatting?: boolean;
  }): Promise<TranslationResponse> {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/translate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.text,
          target_languages: input.target_languages.slice(0, 5),
          source_language: input.source_language ?? null,
          preserve_formatting: input.preserve_formatting ?? true
        })
      },
      30000 // 30 seconds for translation
    );
    return handleResponse<TranslationResponse>(res);
  },

  async detect(text: string): Promise<DetectResponse> {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/detect`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      },
      15000 // 15 seconds for detection
    );
    return handleResponse<DetectResponse>(res);
  },

  async languages(): Promise<LanguagesResponse> {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/languages`,
      {},
      10000 // 10 seconds for language list
    );
    return handleResponse<LanguagesResponse>(res);
  },

  async health(): Promise<HealthResponse> {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/v1/health`,
      {},
      5000 // 5 seconds for health check
    );
    return handleResponse<HealthResponse>(res);
  }
};
