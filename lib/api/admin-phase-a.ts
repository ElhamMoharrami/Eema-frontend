import { apiRequest } from "./client";
import type { SpringPage } from "@/types/admin";
import type { IncidentCategory,IncidentDto,IncidentStatus } from "@/types/incident";
import type { PolicyType,PolicyVersionDto } from "@/types/policy";

type IncidentParams={status?:IncidentStatus;category?:IncidentCategory;bookingId?:string;page?:number;size?:number};
function query(values:Record<string,string|number|undefined>){const q=new URLSearchParams();Object.entries(values).forEach(([k,v])=>{if(v!==undefined&&v!=="")q.set(k,String(v))});const text=q.toString();return text?`?${text}`:""}
export const getAdminIncidents=(params:IncidentParams)=>apiRequest<SpringPage<IncidentDto>>(`/admin/incidents${query(params)}`,{auth:"required"});
export const getAdminIncident=(id:string)=>apiRequest<IncidentDto>(`/admin/incidents/${encodeURIComponent(id)}`,{auth:"required"});
export const startIncidentReview=(id:string)=>apiRequest<IncidentDto>(`/admin/incidents/${encodeURIComponent(id)}/start-review`,{method:"POST",auth:"required"});
export const resolveIncident=(id:string,resolutionNote:string)=>apiRequest<IncidentDto>(`/admin/incidents/${encodeURIComponent(id)}/resolve`,{method:"POST",auth:"required",body:{resolutionNote}});
export const closeIncident=(id:string)=>apiRequest<IncidentDto>(`/admin/incidents/${encodeURIComponent(id)}/close`,{method:"POST",auth:"required"});
export const getAdminPolicies=()=>apiRequest<PolicyVersionDto[]>("/admin/policies",{auth:"required"});
export const createAdminPolicy=(body:{policyType:PolicyType;version:string;title:string;effectiveAt:string;content:string})=>apiRequest<PolicyVersionDto>("/admin/policies",{method:"POST",auth:"required",body});
export const publishAdminPolicy=(id:string)=>apiRequest<PolicyVersionDto>(`/admin/policies/${encodeURIComponent(id)}/publish`,{method:"POST",auth:"required"});
export const retireAdminPolicy=(id:string)=>apiRequest<PolicyVersionDto>(`/admin/policies/${encodeURIComponent(id)}/retire`,{method:"POST",auth:"required"});
