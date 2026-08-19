import { apiRequest } from "./client";
import type { CheckoutResponse } from "@/types/checkout";

export const createCheckout = (bookingId: string) =>
  apiRequest<CheckoutResponse>(`/bookings/${encodeURIComponent(bookingId)}/checkout`, { method: "POST", auth: "required" });
