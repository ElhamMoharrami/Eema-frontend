import * as shape from "./response-shape";
import { apiRequest } from "./client";
import type { CreateIncidentRequest, IncidentDto } from "@/types/incident";

export const getBookingIncidents = (bookingId:string) => apiRequest<IncidentDto[]>(`/bookings/${encodeURIComponent(bookingId)}/incidents`, { validate: shape.array(shape.incident), auth:"required" });
export const createBookingIncident = (bookingId:string, body:CreateIncidentRequest) => apiRequest<IncidentDto>(`/bookings/${encodeURIComponent(bookingId)}/incidents`, { validate: shape.incident, method:"POST", auth:"required", body });
