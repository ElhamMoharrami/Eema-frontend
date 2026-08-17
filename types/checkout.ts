import type { CreateBookingRequest } from "./booking";

export type CheckoutRequest = CreateBookingRequest;

export type CheckoutResponse = {
  bookingId: string;
  checkoutUrl: string;
  molliePaymentId: string;
  totalAmount: number;
  expiresIn: number;
};
