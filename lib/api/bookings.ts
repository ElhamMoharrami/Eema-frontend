import { apiRequest } from "./client";
import type { Booking, CreateBookingRequest } from "@/types/booking";

export const createBooking = (request: CreateBookingRequest) =>
  apiRequest<Booking>("/bookings", { method: "POST", auth: "required", body: request });

export const getBookings = () =>
  apiRequest<Booking[]>("/bookings", { auth: "required" });

// Temporary client-side lookup until Spring exposes GET /bookings/{id}.
export async function getBookingFromCurrentUserList(id: string): Promise<Booking | undefined> {
  const bookings = await getBookings();
  return bookings.find((booking) => booking.id === id);
}
