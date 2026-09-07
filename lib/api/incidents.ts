import { apiRequest } from "./client";
import type { CreateIncidentRequest, IncidentDto } from "@/types/incident";

export const getBookingIncidents = (bookingId:string) => apiRequest<IncidentDto[]>(`/bookings/${encodeURIComponent(bookingId)}/incidents`, { auth:"required" });
export const createBookingIncident = (bookingId:string, body:CreateIncidentRequest) => apiRequest<IncidentDto>(`/bookings/${encodeURIComponent(bookingId)}/incidents`, { method:"POST", auth:"required", body });
