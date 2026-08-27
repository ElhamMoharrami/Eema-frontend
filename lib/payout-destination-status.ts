import type { PayoutDestinationStatus } from "@/types/payout-destination";
export const PAYOUT_DESTINATION_LABELS:Record<PayoutDestinationStatus,string>={PENDING_VERIFICATION:"Under review",VERIFIED:"Verified",REJECTED:"Rejected",REPLACED:"Previous destination"};
