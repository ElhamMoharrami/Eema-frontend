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
import { getAdminVenues } from "@/lib/api/admin";
import { formatTimestamp } from "@/lib/format";
import { VENUE_STATUS_LABELS } from "@/lib/status";
const statuses = Object.entries(VENUE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));
export default function Page() {
  return (
    <AdminShell
      title="Venue moderation"
      intro="Review submitted listings and manage public marketplace visibility through controlled actions."
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
    venueId = s.get("venueId") ?? undefined,
    page = Math.max(0, Number(s.get("page")) || 0);
  const load = useCallback(
    () =>
      getAdminVenues({
        status,
        ownerId,
        venueId,
        page,
        size: 20,
      }),
    [ownerId, page, status, venueId],
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
        defaults={{ status: "PENDING" }}
        filters={[
          { name: "status", label: "Status", options: statuses },
          { name: "ownerId", label: "Owner ID" },
          { name: "venueId", label: "Venue ID" },
        ]}
      />
      <AdminLoadState state={state} error={error} retry={() => void retry()} />
      {state === "ready" &&
        data &&
        (data.content.length === 0 ? (
          <EmptyState
            title="No venues"
            message="No moderation records match these filters."
          />
        ) : (
          <>
            <AdminTable>
              <thead>
                <tr>
                  <Th>Venue</Th>
                  <Th>Status</Th>
                  <Th>Owner reference</Th>
                  <Th>Submitted</Th>
                  <Th>Reviewed</Th>
                  <Th>Readiness</Th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((v) => (
                  <tr key={v.id}>
                    <Td>
                      <div className="font-semibold">{v.name}</div>
                      <div className="mt-1 text-xs text-taupe">
                        {v.neighbourhood}
                      </div>
                      <div className="mt-2">
                        <IdLink href={`/admin/venues/${v.id}`}>{v.id}</IdLink>
                      </div>
                    </Td>
                    <Td>
                      <StatusPill
                        label={VENUE_STATUS_LABELS[v.status]}
                        tone={
                          v.status === "PENDING" || v.status === "SUSPENDED"
                            ? "warning"
                            : "normal"
                        }
                      />
                    </Td>
                    <Td>
                      <span className="break-all font-mono text-xs">
                        {v.ownerId}
                      </span>
                    </Td>
                    <Td>{formatTimestamp(v.submittedForReviewAt)}</Td>
                    <Td>{formatTimestamp(v.reviewedAt)}</Td>
                    <Td>
                      {v.readinessIssues.length === 0
                        ? "Ready"
                        : `${v.readinessIssues.length} issue${v.readinessIssues.length === 1 ? "" : "s"}`}
                    </Td>
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
