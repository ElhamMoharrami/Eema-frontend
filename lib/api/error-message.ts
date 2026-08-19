import { ApiError } from "./client";

export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "We could not reach Eema. Please try again.";
  }
  if (error.code === "NETWORK") return "We could not reach Eema. Please try again.";
  if (error.code === "MALFORMED_RESPONSE") return "Something went wrong while reading the server response.";
  if (error.status === 401) return "Your session has expired. Please sign in again.";
  if (error.status === 403) return "You do not have permission to perform this action.";
  if (error.status === 400 || error.status === 409 || error.status === 422) {
    return safeValidationMessage(error.message) ?? "Please check the information you entered.";
  }
  if (error.status >= 500) return "Something went wrong on our side. Please try again.";
  return "Something went wrong. Please try again.";
}

function safeValidationMessage(message: string): string | null {
  const normalized = message.trim();
  if (!normalized || normalized.length > 180) return null;
  return normalized.replace(/\s+/g, " ");
}
