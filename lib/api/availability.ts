import { apiRequest } from "./client";
import type { VenueAvailabilityDto } from "@/types/availability";

export const getVenueAvailability = (venueId: string, from: string, to: string) => {
  const query = new URLSearchParams({ from, to });
  return apiRequest<VenueAvailabilityDto>(`/venues/${encodeURIComponent(venueId)}/availability?${query.toString()}`, { auth: "optional" });
};
