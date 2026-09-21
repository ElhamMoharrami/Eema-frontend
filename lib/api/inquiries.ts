import * as shape from "./response-shape";
import { apiRequest } from "./client";
import type { Booking } from "@/types/booking";
import type { AvailabilityInquiry, CreateAvailabilityInquiryRequest, OfferAvailabilityInquiryRequest } from "@/types/inquiry";

export const createAvailabilityInquiry = (request: CreateAvailabilityInquiryRequest) =>
  apiRequest<AvailabilityInquiry>("/availability-inquiries", { validate: shape.inquiry, method: "POST", auth: "required", body: request });

export const getMyAvailabilityInquiries = () =>
  apiRequest<AvailabilityInquiry[]>("/availability-inquiries/mine", { validate: shape.array(shape.inquiry), auth: "required" });

export const getOwnedVenueInquiries = () =>
  apiRequest<AvailabilityInquiry[]>("/availability-inquiries/owned-venues", { validate: shape.array(shape.inquiry), auth: "required" });

export const declineAvailabilityInquiry = (id: string) =>
  apiRequest<AvailabilityInquiry>(`/availability-inquiries/${encodeURIComponent(id)}/decline`, { validate: shape.inquiry, method: "POST", auth: "required" });

export const offerAvailabilityInquiry = (id: string, request: OfferAvailabilityInquiryRequest) =>
  apiRequest<AvailabilityInquiry>(`/availability-inquiries/${encodeURIComponent(id)}/offer`, { validate: shape.inquiry, method: "POST", auth: "required", body: request });

export const acceptAvailabilityInquiry = (id: string) =>
  apiRequest<Booking>(`/availability-inquiries/${encodeURIComponent(id)}/accept`, { validate: shape.booking, method: "POST", auth: "required" });
