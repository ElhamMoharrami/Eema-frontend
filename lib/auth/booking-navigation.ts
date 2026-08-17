const BOOKING_ID_KEY = "eema:bookingId";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function saveBookingNavigation(bookingId: string): void {
  storage()?.setItem(BOOKING_ID_KEY, bookingId);
}

export function getBookingNavigation(): string | null {
  return storage()?.getItem(BOOKING_ID_KEY) ?? null;
}
