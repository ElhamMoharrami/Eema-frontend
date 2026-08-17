export type BookingStatus = "PENDING" | "PAID" | "CONFIRMED" | "CANCELLED" | "REFUNDED";

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
  ownerPayoutEur: number | null;
  totalPaidEur: number;
  molliePaymentId: string | null;
  scoutContact: BookingContactSnapshot;
  ownerContact: BookingContactSnapshot;
  createdAt: string;
  paidAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
};
