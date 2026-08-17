import { apiRequest } from "./client";
import type { CreateVenueRequest, Venue, VenueList } from "@/types/venue";

export function getVenues(tag?: string): Promise<VenueList[]> {
  const query = tag?.trim() ? `?tag=${encodeURIComponent(tag.trim())}` : "";
  return apiRequest<VenueList[]>(`/venues${query}`);
}

export const getVenue = (id: string) =>
  apiRequest<Venue>(`/venues/${encodeURIComponent(id)}`, { auth: "optional" });

export const createVenue = (request: CreateVenueRequest) =>
  apiRequest<Venue>("/venues", { method: "POST", auth: "required", body: request });

export const getMyVenues = () =>
  apiRequest<Venue[]>("/venues/my", { auth: "required" });
