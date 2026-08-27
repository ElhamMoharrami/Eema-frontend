"use client";
import Link from "next/link";
import { useCallback } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import PayoutStatementDownload from "@/components/owner/PayoutStatementDownload";
import AdminLoadState from "@/components/admin/AdminLoadState";
import { useAdminPage } from "@/hooks/useAdminPage";
import { getOwnerPayout } from "@/lib/api/owner-payouts";
import { getMyVenues } from "@/lib/api/venues";
import { formatEur, formatTimestamp } from "@/lib/format";
import {
  OWNER_PAYOUT_HOLD_LABELS,
  OWNER_PAYOUT_STATUS_COPY,
  OWNER_PAYOUT_STATUS_LABELS,
} from "@/lib/owner-payout-status";
export default function Page({ params }: { params: { id: string } }) {
  return (
    <DashboardShell
      eyebrow="Owner dashboard"
      title="Payout detail"
      intro="Backend-provided ledger values for this booking payout."
    >
      <RoleGuard role="OWNER">
        <Detail id={params.id} />
      </RoleGuard>
    </DashboardShell>
  );
}
function Detail({ id }: { id: string }) {
  const loader = useCallback(async () => {
    const [p, venues] = await Promise.allSettled([
      getOwnerPayout(id),
      getMyVenues(),
    ]);
    if (p.status === "rejected") throw p.reason;
    return {
      payout: p.value,
      venueName:
        venues.status === "fulfilled"
          ? venues.value.find((v) => v.id === p.value.venueId)?.name
          : null,
    };
  }, [id]);
  const { data, state, error, load } = useAdminPage(loader);
  const p = data?.payout;
  return (
    <>
      <Link
        href="/owner/payouts"
        className="text-sm text-ochre hover:underline"
      >
        ← Back to payouts
      </Link>
      <div className="mt-6">
        <AdminLoadState
          state={state}
          error={error}
          retry={() => void load()}
          notFound="Payout not found"
        />
      </div>
      {state === "ready" && p && (
        <article className="border border-rule bg-paper p-6 md:p-8">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <div className="label">Venue</div>
              <h2 className="mt-2 font-display text-2xl">
                {data.venueName ?? `Venue ${p.venueId}`}
              </h2>
              <p className="mt-1 font-mono text-xs">{p.venueId}</p>
            </div>
            <span className="border border-rule px-3 py-2 text-xs font-semibold uppercase tracking-wider">
              {OWNER_PAYOUT_STATUS_LABELS[p.status]}
            </span>
          </div>
          <dl className="mt-7 grid gap-5 sm:grid-cols-2">
            <Fact
              label="Booking reference"
              value={
                <Link
                  href={`/bookings/${p.bookingId}`}
                  className="font-mono text-xs text-ochre hover:underline"
                >
                  {p.bookingId}
                </Link>
              }
            />
            <Fact label="Currency" value={p.currency} />
          </dl>
          <section className="mt-7 border-t border-rule pt-6">
            <h3 className="font-display text-2xl">Financial breakdown</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Fact
                label="Gross retained amount"
                value={formatEur(p.grossRetainedAmountEur)}
              />
              <Fact
                label="Less: Eema commission"
                value={formatEur(p.commissionEur)}
              />
              <Fact
                label="Less: Payment processing cost"
                value={formatEur(p.providerCostEur)}
              />
              <Fact label="Owner payout" value={formatEur(p.payoutAmountEur)} />
            </dl>
            <p className="mt-4 text-xs text-taupe">
              These are backend-provided ledger values; no amount is
              recalculated here.
            </p>
          </section>
          <section className="mt-7 border-t border-rule pt-6">
            <h3 className="font-display text-2xl">Payout status</h3>
            <p className="mt-3 font-semibold">
              {OWNER_PAYOUT_STATUS_LABELS[p.status]}
            </p>
            <p className="mt-2 text-sm text-ink/75">
              {p.holdReason
                ? OWNER_PAYOUT_HOLD_LABELS[p.holdReason]
                : OWNER_PAYOUT_STATUS_COPY[p.status]}
            </p>
            <dl className="mt-5 grid gap-5 sm:grid-cols-3">
              <Fact label="Eligible" value={formatTimestamp(p.eligibleAt)} />
              <Fact label="Ready" value={formatTimestamp(p.readyAt)} />
              <Fact label="Paid" value={formatTimestamp(p.paidAt)} />
              {p.payoutDestinationMaskedIban && (
                <Fact label="Payout destination" value={p.payoutDestinationMaskedIban} />
              )}
            </dl>
            {p.holdReason === "WAITING_FOR_PAYOUT_DESTINATION" && (
              <Link href="/owner/payout-destination" className="mt-5 inline-block text-sm font-semibold text-ochre hover:underline">
                Add or verify payout details →
              </Link>
            )}
          </section>
          {p.status === "PAID" && p.statementAvailable && (
            <section className="mt-7 border-t border-rule pt-6">
              <h3 className="font-display text-2xl">Payout statement</h3>
              <p className="mt-2 text-sm text-ink/75">
                This statement records the payout Eema recorded as transferred
                for this booking.
              </p>
              <p className="mt-1 mb-4 text-xs text-taupe">
                This is a payment record, not a tax invoice.
              </p>
              <PayoutStatementDownload payoutId={p.id} />
            </section>
          )}
        </article>
      )}
    </>
  );
}
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-1 break-words text-sm">{value}</dd>
    </div>
  );
}
