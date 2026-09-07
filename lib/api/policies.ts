import { apiRequest } from "./client";
import type { AcceptPoliciesRequest, PolicyStatusDto, PolicyType, PolicyVersionDto } from "@/types/policy";

export const getCurrentPolicies = () => apiRequest<PolicyVersionDto[]>("/policies/current", { auth:"required" });
export const getCurrentPolicy = (type:PolicyType) => apiRequest<PolicyVersionDto>(`/policies/${encodeURIComponent(type)}/current`, { auth:"required" });
export const getPolicyStatus = () => apiRequest<PolicyStatusDto>("/policies/status", { auth:"required" });
export const acceptPolicies = (policyVersionIds:string[]) => apiRequest<PolicyStatusDto>("/policies/accept", { method:"POST", auth:"required", body:{policyVersionIds} satisfies AcceptPoliciesRequest });
