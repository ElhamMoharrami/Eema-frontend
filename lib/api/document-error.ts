import { ApiError } from "@/lib/api/client";

export function documentErrorMessage(error: unknown, document: "receipt" | "statement"): string {
  const label = document === "receipt" ? "Receipt" : "Payout statement";
  if (!(error instanceof ApiError) || error.code === "NETWORK") return "Temporary connection issue. Please try again.";
  if (error.status === 401) return "Your session has expired. Please sign in again.";
  if (error.status === 403) return `${label} is not accessible for this account.`;
  if (error.status === 404) return `${label} or its record was not found.`;
  if (error.status === 409 || error.status === 400 || error.status === 422) return `${label} is not currently available.`;
  if (error.status >= 500 || error.code === "MALFORMED_RESPONSE") return `${label} could not be generated or downloaded. Please try again.`;
  return `${label} could not be downloaded. Please try again.`;
}
