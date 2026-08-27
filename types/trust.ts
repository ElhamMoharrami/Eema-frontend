export type OwnerVerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
export type VerificationMethod = "MANUAL_REVIEW" | "VIDEO_CALL" | "BUSINESS_DOCUMENT" | "VENUE_CONTROL_EVIDENCE";

export type OwnerVerificationDto = {
  id: string | null;
  ownerId: string;
  status: OwnerVerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  verificationMethod: VerificationMethod | null;
};

export type AdminOwnerVerificationDto = OwnerVerificationDto & {
  id: string;
  ownerNote: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VenueModerationDto = {
  venueId: string;
  status: import("./venue").VenueStatus;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  moderationReason: string | null;
  readinessIssues: string[];
};

export type AdminVenueModerationDto = {
  id: string;
  ownerId: string;
  name: string;
  neighbourhood: string;
  status: import("./venue").VenueStatus;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  moderationReason: string | null;
  readinessIssues: string[];
  createdAt: string;
  updatedAt: string;
};

export type TrustEventType = "VENUE_SUBMITTED" | "VENUE_APPROVED" | "VENUE_CHANGES_REQUESTED" | "VENUE_SUSPENDED" | "VENUE_REACTIVATED";
export type TrustEventDto = { id: string; eventType: TrustEventType; actorId: string | null; actorType: "OWNER" | "ADMIN" | "SYSTEM"; note: string | null; createdAt: string };
