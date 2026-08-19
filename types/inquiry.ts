export type AvailabilityInquiryStatus = "OPEN" | "DECLINED" | "OFFERED" | "EXPIRED" | "ACCEPTED";

export type AvailabilityInquiry = {
  id: string;
  venueId: string;
  venueName: string;
  timezone: string;
  scoutId: string;
  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  message: string;
  status: AvailabilityInquiryStatus;
  offeredDate: string | null;
  offeredStartTime: string | null;
  offeredEndTime: string | null;
  offerExpiresAt: string | null;
  acceptedBookingId: string | null;
  createdAt: string;
  declinedAt: string | null;
  offeredAt: string | null;
  acceptedAt: string | null;
  expiredAt: string | null;
};

export type CreateAvailabilityInquiryRequest = {
  venueId: string;
  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  message: string;
};

export type OfferAvailabilityInquiryRequest = {
  offeredDate: string;
  offeredStartTime: string;
  offeredEndTime: string;
};
