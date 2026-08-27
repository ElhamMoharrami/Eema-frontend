import { apiRequest } from "@/lib/api/client";
import type { PayoutDestinationDto } from "@/types/payout-destination";

export const getOwnerPayoutDestinations = () =>
  apiRequest<PayoutDestinationDto[]>("/owner/payout-destinations", { auth: "required" });

export const createOwnerPayoutDestination = (body: { accountHolderName: string; iban: string }) =>
  apiRequest<PayoutDestinationDto>("/owner/payout-destinations", {
    method: "POST", auth: "required", body,
  });
