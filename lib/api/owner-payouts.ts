import { apiBinaryRequest, apiRequest } from "@/lib/api/client";
import { saveBinaryDownload } from "@/lib/download";
import type { OwnerPayout, OwnerPayoutPage } from "@/types/owner-payout";

export const getOwnerPayouts = (page = 0, size = 20) =>
  apiRequest<OwnerPayoutPage>(`/owner/payouts?page=${page}&size=${size}`, { auth: "required" });

export const getOwnerPayout = (id: string) =>
  apiRequest<OwnerPayout>(`/owner/payouts/${encodeURIComponent(id)}`, { auth: "required" });

export async function downloadOwnerPayoutStatement(id: string): Promise<void> {
  const response = await apiBinaryRequest(`/owner/payouts/${encodeURIComponent(id)}/statement`);
  saveBinaryDownload(response, "eema-payout-statement.pdf");
}
