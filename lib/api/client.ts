import { API_BASE_URL } from "@/lib/config";
import { getAuthSession, isAuthResponse, saveAuthSession, recoverRefreshFailure, synchronizeAuthSession, type AuthSession } from "@/lib/auth/token";
type AuthMode = "none" | "optional" | "required";
let refreshInFlight: Promise<boolean> | null = null;
const sessionChecks = new Map<string, Promise<void>>();

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: AuthMode;
  body?: unknown;
  retryOnUnauthorized?: boolean;
  responseMode?: "json" | "empty" | "blob";
};

export type BinaryResponse = { blob: Blob; contentDisposition: string | null };

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

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) headers.set("Content-Type", "application/json");

  const session = getAuthSession();
  if (auth === "required" && !session) {
    throw new ApiError(401, "Please sign in to continue.");
  }
  if (auth !== "none" && session) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  const method = (requestInit.method ?? "GET").toUpperCase();
  // Matching uses POST for a bounded search body, but is read-only discovery.
  const isMatchingRead = method === "POST" && path === "/match";
  if (auth === "required" && session?.user.emailVerified === false && method !== "GET" && !isMatchingRead && !path.startsWith("/admin/")) {
    throw new ApiError(403, "Verify your email before continuing.", { reason: "EMAIL_UNVERIFIED" });
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...requestInit,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Could not reach Eema", undefined, "NETWORK");
  }

  const assertCurrentActor = () => {
    if (auth !== "required" || !session) return;
    const current = getAuthSession();
    if (!current || current.user.id !== session.user.id) {
      throw new ApiError(401, "Please sign in to continue.");
    }
  };
  assertCurrentActor();

  // A parallel read can return 403 under an old token while another request rotates it.
  // A 403 alone never starts refresh. If recovery has not started, a coalesced /me
  // check distinguishes a valid forbidden session from an expired one returning401.
  // Only a successful new generation permits replay; writes are excluded.
  if (response.status === 403 && auth === "required" && session && retryOnUnauthorized
      && (method === "GET" || method === "HEAD") && path !== "/auth/me") {
    if (getAuthSession()?.generation === session.generation) {
      if (refreshInFlight) await refreshInFlight;
      else await checkSession(session);
    }
    assertCurrentActor();
    if (getAuthSession()?.generation !== session.generation) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  if (response.status === 401 && auth === "required" && session && retryOnUnauthorized) {
    const refreshed = await refreshSession(session);
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  if (!response.ok) {
    const error = await toApiError(response);
    assertCurrentActor();
    if (error.status === 403 && /polic/i.test(error.message) && typeof window !== "undefined") {
      window.dispatchEvent(new Event("eema:policy-stale"));
    }
    throw error;
  }
  if (response.status === 204 || responseMode === "empty") return undefined as T;
  if (responseMode === "blob") {
    const blob = await response.blob();
    assertCurrentActor();
    return { blob, contentDisposition: response.headers.get("Content-Disposition") } as T;
  }

  const text = await response.text();
  assertCurrentActor();
  if (!text) {
    throw new ApiError(response.status, "Expected a response body", undefined, "MALFORMED_RESPONSE");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(response.status, "Could not read the server response", undefined, "MALFORMED_RESPONSE");
  }
}

export function apiBinaryRequest(path: string): Promise<BinaryResponse> {
  return apiRequest<BinaryResponse>(path, {
    auth: "required",
    responseMode: "blob",
    headers: { Accept: "application/pdf" },
  });
}

// Resolve only this generation's concurrent probes; /me itself cannot recurse here.
async function checkSession(session: AuthSession): Promise<void> {
  let check = sessionChecks.get(session.generation);
  if (!check) {
    check = apiRequest("/auth/me", { auth: "required" })
      .then(() => undefined, () => undefined)
      .finally(() => sessionChecks.delete(session.generation));
    sessionChecks.set(session.generation, check);
  }
  await check;
}

async function refreshSession(session: AuthSession): Promise<boolean> {
  if (getAuthSession()?.generation !== session.generation) return synchronizeAuthSession();
  if (!refreshInFlight) {
    refreshInFlight = performRefresh(session).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRefresh(session: AuthSession): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!response.ok) {
      return recoverRefreshFailure(session.generation);
    }
    const body = await response.json() as unknown;
    if (!isAuthResponse(body)) {
      return recoverRefreshFailure(session.generation);
    }
    // A login, logout or another rotation may have superseded this request.
    if (getAuthSession()?.generation !== session.generation) return synchronizeAuthSession();
    saveAuthSession(body);
    return true;
  } catch {
    return recoverRefreshFailure(session.generation);
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
