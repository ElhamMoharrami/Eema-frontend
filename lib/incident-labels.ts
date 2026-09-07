import type { IncidentCategory,IncidentStatus } from "@/types/incident";
export const INCIDENT_CATEGORY_LABELS:Record<IncidentCategory,string>={PROPERTY_DAMAGE:"Property damage",ACCESS_PROBLEM:"Access problem",SAFETY:"Safety concern",NOISE_NEIGHBOUR:"Noise or neighbour issue",MISREPRESENTATION:"Listing mismatch / misrepresentation",CONDUCT:"Conduct issue",OTHER:"Other"};
export const INCIDENT_STATUS_LABELS:Record<IncidentStatus,string>={OPEN:"Reported",UNDER_REVIEW:"Under review",RESOLVED:"Resolved",CLOSED:"Closed"};
