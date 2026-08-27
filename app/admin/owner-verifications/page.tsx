"use client";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import FilterBar from "@/components/admin/FilterBar";
import Pagination from "@/components/admin/Pagination";
import AdminLoadState from "@/components/admin/AdminLoadState";
import EmptyState from "@/components/ui/EmptyState";
import {
  AdminTable,
  IdLink,
  StatusPill,
  Td,
  Th,
} from "@/components/admin/AdminUi";
import { useAdminPage } from "@/hooks/useAdminPage";
import { getAdminOwnerVerifications } from "@/lib/api/admin";
import { formatTimestamp } from "@/lib/format";
import type { OwnerVerificationStatus } from "@/types/trust";
const labels: Record<OwnerVerificationStatus, string> = {
  UNVERIFIED: "Not submitted",
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};
const statuses = Object.entries(labels).map(([value, label]) => ({
  value,
  label,
}));
export default function Page() {
  return (
    <AdminShell
      title="Owner verification"
      intro="Manual owner-review queue. Verification records marketplace vetting, not automated KYC."
    >
      <Queue />
    </AdminShell>
  );
}
function Queue() {
  const s = useSearchParams(),
    router = useRouter(),
    status = s.get("status") ?? "PENDING",
    ownerId = s.get("ownerId") ?? undefined,
    page = Math.max(0, Number(s.get("page")) || 0);
  const load = useCallback(
    () =>
      getAdminOwnerVerifications({
        status,
        ownerId,
        page,
        size: 20,
      }),
    [ownerId, page, status],
  );
  const { data, state, error, load: retry } = useAdminPage(load);
  function go(p: number) {
    const q = new URLSearchParams(s.toString());
    q.set("page", String(p));
    if (!q.has("status")) q.set("status", status);
    router.push(`?${q}`);
  }
  return (
    <>
      <FilterBar
        filters={[
          { name: "status", label: "Status", options: statuses },
          { name: "ownerId", label: "Owner ID" },
        ]}
        defaults={{ status: "PENDING" }}
      />
      <AdminLoadState state={state} error={error} retry={() => void retry()} />
      {state === "ready" &&
        data &&
        (data.content.length === 0 ? (
          <EmptyState
            title="No owner reviews"
            message="No verification records match these filters."
          />
        ) : (
          <>
            <AdminTable>
              <thead>
                <tr>
                  <Th>Status</Th>
                  <Th>Owner reference</Th>
                  <Th>Submission context</Th>
                  <Th>Submitted</Th>
                  <Th>Reviewed</Th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((v) => (
                  <tr key={v.id}>
                    <Td>
                      <StatusPill
                        label={labels[v.status]}
                        tone={v.status === "PENDING" ? "warning" : "normal"}
                      />
                    </Td>
                    <Td>
                      <IdLink href={`/admin/owner-verifications/${v.id}`}>
                        {v.ownerId}
                      </IdLink>
                    </Td>
                    <Td>{v.ownerNote ?? "—"}</Td>
                    <Td>{formatTimestamp(v.submittedAt)}</Td>
                    <Td>{formatTimestamp(v.reviewedAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              onPage={go}
            />
          </>
        ))}
    </>
  );
}
