"use client";
import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AdminLoadState from "@/components/admin/AdminLoadState";
import { Detail, IdLink, StatusPill } from "@/components/admin/AdminUi";
import { useAdminPage } from "@/hooks/useAdminPage";
import { getAdminPayout, markAdminPayoutPaid } from "@/lib/api/admin";
import { apiErrorMessage } from "@/lib/api/error-message";
import { formatEur, formatTimestamp } from "@/lib/format";
import { PAYOUT_HOLD_LABELS, PAYOUT_STATUS_LABELS } from "@/lib/admin-status";
export default function Page({ params }: { params: { id: string } }) {
  return (
    <AdminShell
      title="Payout detail"
      intro="Authoritative payout amounts, eligibility, hold, readiness, and transfer record."
    >
      <View id={params.id} />
    </AdminShell>
  );
}
function View({ id }: { id: string }) {
  const loader = useCallback(() => getAdminPayout(id), [id]);
  const { data: p, state, error, load } = useAdminPage(loader);
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ref = String(
      new FormData(e.currentTarget).get("reference") ?? "",
    ).trim();
    if (!ref) return;
    setBusy(true);
    setActionError("");
    try {
      await markAdminPayoutPaid(id, ref);
      setConfirm(false);
      await load();
    } catch (x) {
      setActionError(apiErrorMessage(x));
      await load();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="mb-6">
        <Link
          href="/admin/payouts"
          className="text-sm text-ochre hover:underline"
        >
          ← Back to payouts
        </Link>
      </p>
      <AdminLoadState
        state={state}
        error={error}
        retry={() => void load()}
        notFound="Payout not found"
      />
      {actionError && (
        <p role="alert" className="mb-5 text-sm text-red-800">
          {actionError}
        </p>
      )}
      {state === "ready" && p && (
        <article className="border border-rule bg-paper p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <IdLink href={`/admin/payouts/${p.id}`}>{p.id}</IdLink>
            <StatusPill
              label={PAYOUT_STATUS_LABELS[p.status]}
              tone={p.status === "HELD" ? "warning" : "normal"}
            />
          </div>
          <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              label="Booking"
              value={
                <IdLink href={`/admin/bookings/${p.bookingId}`}>
                  {p.bookingId}
                </IdLink>
              }
            />
            <Detail label="Owner ID" value={p.ownerId} mono />
            <Detail label="Venue ID" value={p.venueId} mono />
            <Detail label="Currency" value={p.currency} />
            <Detail
              label="Gross retained"
              value={formatEur(p.grossRetainedAmountEur)}
            />
            <Detail label="Commission" value={formatEur(p.commissionEur)} />
            <Detail
              label="Provider cost"
              value={formatEur(p.providerCostEur)}
            />
            <Detail
              label="Payout amount"
              value={formatEur(p.payoutAmountEur)}
            />
            <Detail
              label="Hold reason"
              value={
                p.holdReason
                  ? PAYOUT_HOLD_LABELS[p.holdReason]
                  : "Not applicable"
              }
            />
            <Detail label="Eligible" value={formatTimestamp(p.eligibleAt)} />
            <Detail label="Ready" value={formatTimestamp(p.readyAt)} />
            <Detail label="Paid" value={formatTimestamp(p.paidAt)} />
            <Detail
              label="External transfer reference"
              value={p.externalTransferReference ?? "Not available"}
              mono
            />
            <Detail label="Destination account holder" value={p.payoutDestinationAccountHolderName ?? "Not snapshotted"} />
            <Detail label="Payout destination" value={p.payoutDestinationMaskedIban ?? "Not snapshotted"} mono />
            <Detail label="Created" value={formatTimestamp(p.createdAt)} />
            <Detail label="Updated" value={formatTimestamp(p.updatedAt)} />
          </dl>
          {p.status === "READY" && !p.payoutDestinationId && (
            <section className="mt-8 border border-red-300 bg-red-50 p-5">
              <p role="alert" className="font-semibold text-red-900">This payout does not have a valid verified destination.</p>
              <p className="mt-2 text-sm text-red-900/80">Do not record payment. Reconcile the payout destination first.</p>
            </section>
          )}
          {p.status === "READY" && p.payoutDestinationId && (
            <section className="mt-8 border-t border-rule pt-6">
              <div className="mb-5 border border-rule bg-paperDeep p-4">
                <div className="label">Payout destination</div>
                <p className="mt-2 font-semibold">{p.payoutDestinationAccountHolderName}</p>
                <p className="mt-1 font-mono text-sm">{p.payoutDestinationMaskedIban}</p>
                <Link href={`/admin/payout-destinations/${p.payoutDestinationId}`} className="mt-3 inline-block text-sm text-ochre hover:underline">Open destination review and audited reveal →</Link>
              </div>
              {!confirm ? (
                <button
                  className="btn btn-ochre"
                  onClick={() => setConfirm(true)}
                >
                  Mark as paid
                </button>
              ) : (
                <form
                  onSubmit={submit}
                  className="max-w-xl border border-ochre bg-amber-50 p-5"
                >
                  <h2 className="font-display text-2xl">
                    Confirm external transfer
                  </h2>
                  <p className="mt-3 text-sm font-semibold">
                    You are recording an external/manual transfer. This action
                    does not send money.
                  </p>
                  <label
                    className="label label-ink mt-5 block"
                    htmlFor="reference"
                  >
                    External transfer reference
                    <input
                      id="reference"
                      name="reference"
                      className="form-input"
                      maxLength={200}
                      required
                      disabled={busy}
                    />
                  </label>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button className="btn btn-ochre" disabled={busy}>
                      {busy ? "Recording…" : "Mark payout paid"}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => setConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
        </article>
      )}
    </>
  );
}
