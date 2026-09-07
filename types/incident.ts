import type { SpringPage } from "./admin";

export type IncidentCategory = "PROPERTY_DAMAGE" | "ACCESS_PROBLEM" | "SAFETY" | "NOISE_NEIGHBOUR" | "MISREPRESENTATION" | "CONDUCT" | "OTHER";
export type IncidentStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
export type IncidentDto = { id:string; bookingId:string; reportedByUserId:string; category:IncidentCategory; description:string; status:IncidentStatus; createdAt:string; updatedAt:string; resolvedAt:string|null; resolutionNote:string|null };
export type CreateIncidentRequest = { category:IncidentCategory; description:string };
export type ResolveIncidentRequest = { resolutionNote:string };
export type IncidentPage = SpringPage<IncidentDto>;
