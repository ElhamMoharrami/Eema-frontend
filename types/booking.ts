export type BookingStatus = "PENDING" | "PAID" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
export type OwnerPayoutStatus = "CALCULATED_NOT_PAID" | "PAID_MANUALLY";
export type PaymentCreationStatus = "NOT_STARTED" | "CREATING" | "CREATED";
export type RefundStatus = "NONE" | "CREATING" | "QUEUED" | "PENDING" | "PROCESSING" | "REFUNDED" | "FAILED" | "CANCELED";

export type BookingContactSnapshot = {
  name: string;
  email: string;
  phone: string | null;
};

export type ScoutContactRequest = {
  name: string;
  email: string;
  phone?: string;
};

export type CreateBookingRequest = {
  venueId: string;
  shootDate: string;
  rawBrief: string;
  scoutContact: ScoutContactRequest;
};

export type Booking = {
  id: string;
  venueId: string;
  scoutId: string;
  status: BookingStatus;
  shootDate: string;
  startTime: string;
  endTime: string;
  rawBrief: string;
  venuePriceEur: number;
  commissionPercentage: number;
  commissionEur: number;
  mollieFeeEur: number | null;
  mollieFeeReconciled: boolean;
  mollieFeeReconciledAt: string | null;
  ownerPayoutEur: number | null;
  ownerPayoutStatus: OwnerPayoutStatus;
  totalPaidEur: number;
  molliePaymentId: string | null;
  paymentCreationStatus: PaymentCreationStatus;
  refundStatus: RefundStatus;
  mollieRefundId: string | null;
  refundAmountEur: number | null;
  refundRequestedAt: string | null;
  refundedAt: string | null;
  scoutContact: BookingContactSnapshot;
  ownerContact: BookingContactSnapshot;
  createdAt: string;
  paidAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
};
