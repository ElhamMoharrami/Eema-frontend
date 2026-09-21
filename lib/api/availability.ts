import * as shape from "./response-shape";
import { apiRequest } from "./client";
import type { VenueAvailabilityDto } from "@/types/availability";

export const getVenueAvailability = (venueId: string, from: string, to: string) => {
  const query = new URLSearchParams({ from, to });
  return apiRequest<VenueAvailabilityDto>(`/venues/${encodeURIComponent(venueId)}/availability?${query.toString()}`, { validate: shape.availability, auth: "optional" });
};
