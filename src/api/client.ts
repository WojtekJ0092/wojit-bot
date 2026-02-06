// ---------------------------------------------------------------------------
// Low-level HTTP client — adds auth, rate-limit handling, version tracking
// ---------------------------------------------------------------------------

import type { ApiErrorBody, VersionHeaders } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const PUBLIC_TOKEN = import.meta.env.VITE_PUBLIC_TOKEN ?? "";

// Stores the last-seen version so the UI can prompt a refresh.
let _lastVersion: VersionHeaders | null = null;

/** Return the most recently seen API version headers. */
export function getLastVersionHeaders(): VersionHeaders | null {
  return _lastVersion;
}

/** Build the standard Authorization header. */
function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${PUBLIC_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/** Capture X-API-Version and X-Schema-Hash from every response. */
function captureVersion(res: Response): void {
  const v = res.headers.get("X-API-Version");
  const h = res.headers.get("X-Schema-Hash");
  if (v && h) {
    if (_lastVersion && (_lastVersion.apiVersion !== v || _lastVersion.schemaHash !== h)) {
      // Version changed — consumers can subscribe via getLastVersionHeaders()
      console.warn("[wojit-bot] API version changed — users should refresh.");
    }
    _lastVersion = { apiVersion: v, schemaHash: h };
  }
}

// ---- Public helpers -------------------------------------------------------

export class ApiError extends Error {
  code: string;
  requestId: string;

  constructor(body: ApiErrorBody) {
    super(body.error.message);
    this.name = "ApiError";
    this.code = body.error.code;
    this.requestId = body.error.request_id;
  }
}

/**
 * Generic GET request against the API.
 * Automatically retries once on 401 and respects Retry-After on 429.
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(path, API_BASE);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }

  let res = await fetch(url.toString(), { headers: authHeaders(), signal });

  // Retry once on 401
  if (res.status === 401) {
    res = await fetch(url.toString(), { headers: authHeaders(), signal });
  }

  // Rate-limited — wait and retry once
  if (res.status === 429) {
    const wait = Number(res.headers.get("Retry-After") ?? "2") * 1000;
    await delay(wait);
    res = await fetch(url.toString(), { headers: authHeaders(), signal });
  }

  captureVersion(res);

  if (!res.ok) {
    const body = (await res.json()) as ApiErrorBody;
    throw new ApiError(body);
  }

  return (await res.json()) as T;
}

/**
 * Generic POST request against the API.
 * Same retry behaviour as apiGet.
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(path, API_BASE);

  let res = await fetch(url.toString(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal,
  });

  if (res.status === 401) {
    res = await fetch(url.toString(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal,
    });
  }

  if (res.status === 429) {
    const wait = Number(res.headers.get("Retry-After") ?? "2") * 1000;
    await delay(wait);
    res = await fetch(url.toString(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal,
    });
  }

  captureVersion(res);

  if (!res.ok) {
    const errBody = (await res.json()) as ApiErrorBody;
    throw new ApiError(errBody);
  }

  return (await res.json()) as T;
}

/**
 * Open an SSE (EventSource-like) connection via fetch for streaming answers.
 * Returns a ReadableStream of raw SSE lines so callers can parse events.
 */
export function apiPostStream(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): { response: Promise<Response> } {
  const url = new URL(path, API_BASE);

  const response = fetch(url.toString(), {
    method: "POST",
    headers: {
      ...authHeaders(),
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
  });

  return { response };
}

// ---- Internal helpers ------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
