import { apiRequest } from "./client";
import type { CreateAvailabilityOverrideRequest, CreateVenueRequest, UpdateVenueRequest, Venue, VenueAvailabilitySettings, VenueList, WeeklyIntervalRequest } from "@/types/venue";
import type { VenueModerationDto } from "@/types/trust";

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

export const updateVenue = (id: string, request: UpdateVenueRequest) =>
  apiRequest<Venue>(`/venues/${encodeURIComponent(id)}`, { method: "PUT", auth: "required", body: request });

export function uploadAndAttachVenuePhoto(id: string, file: File): Promise<Venue> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<Venue>(`/venues/${encodeURIComponent(id)}/photos`, { method: "POST", auth: "required", body });
}

export const getVenueAvailabilitySettings = (venueId: string) =>
  apiRequest<VenueAvailabilitySettings>(`/venues/${encodeURIComponent(venueId)}/availability/settings`, { auth: "required" });

export const updateVenueTimezone = (venueId: string, timezone: string) =>
  apiRequest<VenueAvailabilitySettings>(`/venues/${encodeURIComponent(venueId)}/availability/settings`, { method: "PUT", auth: "required", body: { timezone } });

export const replaceWeeklyAvailability = (venueId: string, intervals: WeeklyIntervalRequest[]) =>
  apiRequest<VenueAvailabilitySettings>(`/venues/${encodeURIComponent(venueId)}/availability/weekly`, { method: "PUT", auth: "required", body: { intervals } });

export const createAvailabilityOverride = (venueId: string, request: CreateAvailabilityOverrideRequest) =>
  apiRequest<import("@/types/venue").AvailabilityOverride>(`/venues/${encodeURIComponent(venueId)}/availability/overrides`, { method: "POST", auth: "required", body: request });

export const deleteAvailabilityOverride = (venueId: string, overrideId: string) =>
  apiRequest<void>(`/venues/${encodeURIComponent(venueId)}/availability/overrides/${encodeURIComponent(overrideId)}`, { method: "DELETE", auth: "required", responseMode: "empty" });

export const getVenueModeration = (venueId: string) =>
  apiRequest<VenueModerationDto>(`/venues/${encodeURIComponent(venueId)}/moderation`, { auth:"required" });

export const submitVenueForReview = (venueId: string) =>
  apiRequest<VenueModerationDto>(`/venues/${encodeURIComponent(venueId)}/submit-for-review`, { method:"POST", auth:"required" });
