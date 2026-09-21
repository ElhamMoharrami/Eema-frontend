import * as shape from "./response-shape";
import { apiRequest } from "./client";
import type { OwnerVerificationDto } from "@/types/trust";

export const getOwnerVerification = () =>
  apiRequest<OwnerVerificationDto>("/owner/verification", { validate: shape.verification, auth: "required" });

export const submitOwnerVerification = (note?: string) =>
  apiRequest<OwnerVerificationDto>("/owner/verification/submit", { validate: shape.verification,
    method: "POST", auth: "required", body: note?.trim() ? { note: note.trim() } : {},
  });
