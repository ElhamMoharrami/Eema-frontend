import * as shape from "./response-shape";
import { apiRequest } from "@/lib/api/client";
import type { PayoutDestinationDto } from "@/types/payout-destination";

export const getOwnerPayoutDestinations = () =>
  apiRequest<PayoutDestinationDto[]>("/owner/payout-destinations", { validate: shape.array(shape.destination), auth: "required" });

export const createOwnerPayoutDestination = (body: { accountHolderName: string; iban: string }) =>
  apiRequest<PayoutDestinationDto>("/owner/payout-destinations", { validate: shape.destination,
    method: "POST", auth: "required", body,
  });
