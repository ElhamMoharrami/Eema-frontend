import * as shape from "./response-shape";
import { apiBinaryRequest, apiRequest } from "./client";
import { saveBinaryDownload } from "@/lib/download";
import type { Booking, CancellationPreview, CreateBookingRequest } from "@/types/booking";

export const createBooking = (request: CreateBookingRequest) =>
  apiRequest<Booking>("/bookings", { validate: shape.booking, method: "POST", auth: "required", body: request });

export const getBookings = () =>
  apiRequest<Booking[]>("/bookings", { validate: shape.array(shape.booking), auth: "required" });

export const getBooking = (id: string) =>
  apiRequest<Booking>(`/bookings/${encodeURIComponent(id)}`, { validate: shape.booking, auth: "required" });

export async function downloadBookingReceipt(id: string): Promise<void> {
  const response = await apiBinaryRequest(`/bookings/${encodeURIComponent(id)}/receipt`);
  saveBinaryDownload(response, "eema-booking-receipt.pdf");
}

export const acceptBookingRequest = (id: string) =>
  apiRequest<Booking>(`/bookings/${encodeURIComponent(id)}/accept`, { validate: shape.booking, method: "POST", auth: "required" });

export const declineBookingRequest = (id: string) =>
  apiRequest<Booking>(`/bookings/${encodeURIComponent(id)}/decline`, { validate: shape.booking, method: "POST", auth: "required" });

export const getCancellationPreview = (id: string) =>
  apiRequest<CancellationPreview>(`/bookings/${encodeURIComponent(id)}/cancellation-preview`, { validate: shape.cancellationPreview, auth: "required" });

export const cancelBooking = (id: string, reason?: string, previewToken?: string) =>
  apiRequest<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, { validate: shape.booking,
    method: "POST", auth: "required", retryOnUnauthorized: false, body: { reason, previewToken },
  });
