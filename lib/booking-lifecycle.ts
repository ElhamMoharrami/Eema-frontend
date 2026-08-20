import type { Booking } from "@/types/booking";

export function isPaymentWindowExpiry(booking: Booking): boolean {
  return booking.status === "EXPIRED" && booking.paymentExpiresAt !== null;
}
