export type CheckoutResponse = {
  bookingId: string;
  checkoutUrl: string;
  molliePaymentId: string;
  totalAmount: number; // Spring BigDecimal is serialized by Jackson as a JSON number.
  expiresIn: number;
};
