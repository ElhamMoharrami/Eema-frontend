import * as shape from "./response-shape";
import { apiRequest } from "./client";
import type { AcceptPoliciesRequest, PolicyStatusDto, PolicyType, PolicyVersionDto } from "@/types/policy";

export const getCurrentPolicies = () => apiRequest<PolicyVersionDto[]>("/policies/current", { validate: shape.array(shape.policy), auth:"required" });
export const getCurrentPolicy = (type:PolicyType) => apiRequest<PolicyVersionDto>(`/policies/${encodeURIComponent(type)}/current`, { validate: shape.policy, auth:"required" });
export const getPolicyStatus = () => apiRequest<PolicyStatusDto>("/policies/status", { validate: shape.policyStatus, auth:"required" });
export const acceptPolicies = (policyVersionIds:string[]) => apiRequest<PolicyStatusDto>("/policies/accept", { validate: shape.policyStatus, method:"POST", auth:"required", body:{policyVersionIds} satisfies AcceptPoliciesRequest });
