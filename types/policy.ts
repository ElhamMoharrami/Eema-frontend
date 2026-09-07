export type PolicyType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "ACCEPTABLE_USE_POLICY" | "PRODUCTION_POLICY" | "INSURANCE_REQUIREMENTS";
export type PolicyStatus = "DRAFT" | "PUBLISHED" | "RETIRED";
export type PolicyVersionDto = { id:string; policyType:PolicyType; version:string; title:string; effectiveAt:string; publishedAt:string|null; content:string; contentHash:string|null; status:PolicyStatus; createdAt:string; accepted:boolean };
export type PolicyStatusDto = { allRequiredAccepted:boolean; missing:PolicyVersionDto[] };
export type AcceptPoliciesRequest = { policyVersionIds:string[] };
