import type { BookingStatus } from "@/types/booking";
import type { VenueStatus } from "@/types/venue";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  REQUESTED: "Requested",
  AWAITING_PAYMENT: "Awaiting payment",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  UNAVAILABLE: "Time unavailable",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const VENUE_STATUS_LABELS: Record<VenueStatus, string> = {
  DRAFT: "Draft",
  PENDING: "In review",
  ACTIVE: "Live",
  SUSPENDED: "Suspended",
};
