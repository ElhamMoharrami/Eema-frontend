import type { Venue, VenueList } from "@/types/venue";
import { API_BASE_URL } from "@/lib/config";

// Backend media is authoritative. The local URL is presentation-only and degrades to a monogram.
export function venuePhoto(venue: VenueList | Venue): string {
  if ("firstPhotoUrl" in venue && venue.firstPhotoUrl) return backendMediaUrl(venue.firstPhotoUrl);
  if ("photoPaths" in venue && venue.photoPaths.length > 0) return backendMediaUrl(venue.photoPaths[0]);
  return `/photos/${venue.id}.jpg`;
}

export function backendMediaUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  try {
    return new URL(path, `${new URL(API_BASE_URL).origin}/`).toString();
  } catch {
    return path;
  }
}
