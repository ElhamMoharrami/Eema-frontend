import { API_BASE_URL } from "@/lib/config";
import { clearAuthSession, getAuthSession, isAuthResponse, saveAuthSession } from "@/lib/auth/token";
type AuthMode = "none" | "optional" | "required";
let refreshInFlight: Promise<boolean> | null = null;

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: AuthMode;
  body?: unknown;
  retryOnUnauthorized?: boolean;
  responseMode?: "json" | "empty";
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
    public readonly code: "HTTP" | "NETWORK" | "MALFORMED_RESPONSE" = "HTTP",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    auth = "none",
    body,
    headers: suppliedHeaders,
    retryOnUnauthorized = true,
    responseMode = "json",
    ...requestInit
  } = options;
  const headers = new Headers(suppliedHeaders);
  headers.set("Accept", "application/json");

  if (body !== undefined) headers.set("Content-Type", "application/json");

  const session = getAuthSession();
  if (auth === "required" && !session) {
    throw new ApiError(401, "Please sign in to continue.");
  }
  if (auth !== "none" && session) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...requestInit,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Could not reach Eema", undefined, "NETWORK");
  }

  if (response.status === 401 && auth === "required" && session && retryOnUnauthorized) {
    const refreshed = await refreshSession(session.refreshToken);
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204 || responseMode === "empty") return undefined as T;

  const text = await response.text();
  if (!text) {
    throw new ApiError(response.status, "Expected a response body", undefined, "MALFORMED_RESPONSE");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(response.status, "Could not read the server response", undefined, "MALFORMED_RESPONSE");
  }
}

async function refreshSession(refreshToken: string): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh(refreshToken).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      clearAuthSession();
      return false;
    }
    const body = await response.json() as unknown;
    if (!isAuthResponse(body)) {
      clearAuthSession();
      return false;
    }
    saveAuthSession(body);
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const text = await response.text();
  let details: unknown;
  let message = `Request failed with status ${response.status}`;

  if (text) {
    try {
      details = JSON.parse(text) as unknown;
      if (typeof details === "object" && details !== null) {
        const record = details as Record<string, unknown>;
        const candidate = record.message ?? record.error;
        if (typeof candidate === "string" && candidate.trim()) message = candidate;
      }
    } catch {
      details = text;
    }
  }
  return new ApiError(response.status, message, details);
}
