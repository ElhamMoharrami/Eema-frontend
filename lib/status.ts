import type { BookingStatus } from "@/types/booking";
import type { VenueStatus } from "@/types/venue";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const VENUE_STATUS_LABELS: Record<VenueStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending review",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};
