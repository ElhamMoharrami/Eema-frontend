import type { CreateBookingRequest } from "./booking";

export type CheckoutRequest = CreateBookingRequest;

export type CheckoutResponse = {
  bookingId: string;
  checkoutUrl: string;
  molliePaymentId: string;
  totalAmount: number; // Spring BigDecimal is serialized by Jackson as a JSON number.
  expiresIn: number;
};
