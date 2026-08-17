import { apiRequest } from "./client";
import type { Booking, CreateBookingRequest } from "@/types/booking";

export const createBooking = (request: CreateBookingRequest) =>
  apiRequest<Booking>("/bookings", { method: "POST", auth: "required", body: request });

export const getBookings = () =>
  apiRequest<Booking[]>("/bookings", { auth: "required" });

export const getBooking = (id: string) =>
  apiRequest<Booking>(`/bookings/${encodeURIComponent(id)}`, { auth: "required" });

export const confirmBooking = (id: string) =>
  apiRequest<Booking>(`/bookings/${encodeURIComponent(id)}/confirm`, { method: "POST", auth: "required" });

export const cancelBooking = (id: string) =>
  apiRequest<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST", auth: "required" });
