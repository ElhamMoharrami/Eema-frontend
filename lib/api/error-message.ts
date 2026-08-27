import { ApiError } from "./client";

export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "We could not reach Eema. Please try again.";
  }
  if (error.code === "NETWORK") return "Temporary connectivity issue. Please try again.";
  if (error.code === "MALFORMED_RESPONSE") return "Something went wrong while reading the server response.";
  if (error.status === 401) return "Your session has expired. Please sign in again.";
  if (error.status === 403) return "ADMIN access is required for this operation.";
  if (error.status === 404) return "The requested record was not found.";
  if (error.status === 409) return "The operation or record state changed. Refresh and review the latest status.";
  if (error.status === 400 || error.status === 422) {
    return safeValidationMessage(error.message) ?? "Please check the information you entered.";
  }
  if (error.status >= 500) return "This operation is temporarily unavailable. Please try again.";
  return "Something went wrong. Please try again.";
}

function safeValidationMessage(message: string): string | null {
  const normalized = message.trim();
  if (!normalized || normalized.length > 180) return null;
  return normalized.replace(/\s+/g, " ");
}
