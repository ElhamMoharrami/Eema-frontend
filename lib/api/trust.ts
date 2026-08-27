import { apiRequest } from "./client";
import type { OwnerVerificationDto } from "@/types/trust";

export const getOwnerVerification = () =>
  apiRequest<OwnerVerificationDto>("/owner/verification", { auth: "required" });

export const submitOwnerVerification = (note?: string) =>
  apiRequest<OwnerVerificationDto>("/owner/verification/submit", {
    method: "POST", auth: "required", body: note?.trim() ? { note: note.trim() } : {},
  });
