import { apiRequest } from "./client";
import type { CheckoutRequest, CheckoutResponse } from "@/types/checkout";

export const createCheckout = (request: CheckoutRequest) =>
  apiRequest<CheckoutResponse>("/checkout", { method: "POST", auth: "required", body: request });
