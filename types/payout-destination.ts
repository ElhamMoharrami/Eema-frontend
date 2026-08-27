export type PayoutDestinationStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "REPLACED";
export type PayoutDestinationType = "IBAN";

export type PayoutDestinationDto = {
  id: string;
  ownerId: string;
  type: PayoutDestinationType;
  currency: "EUR";
  accountHolderName: string;
  maskedIban: string;
  status: PayoutDestinationStatus;
  submittedAt: string;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  replacedAt: string | null;
  anotherVerifiedDestinationExists: boolean;
};

export type PayoutDestinationRevealDto = {
  id: string;
  accountHolderName: string;
  iban: string;
};
