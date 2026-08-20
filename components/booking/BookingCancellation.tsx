"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cancelBooking, getCancellationPreview } from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatEur, formatTimeRange, formatTimestamp } from "@/lib/format";
import type { Booking, CancellationPolicyTier, CancellationPreview } from "@/types/booking";

type Props = { booking: Booking; venueName: string; venueTimezone: string | null; onChanged: () => void | Promise<void> };

export default function BookingCancellation({ booking, venueName, venueTimezone, onChanged }: Props) {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"preview" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const scoutUnpaid = role === "SCOUT" && (booking.status === "REQUESTED" || booking.status === "AWAITING_PAYMENT");
  const canCancelConfirmed = (role === "SCOUT" || role === "OWNER") && booking.status === "CONFIRMED";

  if (!scoutUnpaid && !canCancelConfirmed) return null;

  async function begin() {
    if (busy || submitting.current) return;
    setError(null);
    if (scoutUnpaid) { setPreview(null); setOpen(true); return; }
    setBusy("preview");
    try {
      const result = await getCancellationPreview(booking.id);
      setPreview(result);
      setOpen(true);
      if (!result.canCancel) setError("This booking cannot currently be cancelled.");
    } catch (failure) { setError(cancellationError(failure)); }
    finally { setBusy(null); }
  }

  async function confirm() {
    if (busy || submitting.current) return;
    if (role === "OWNER" && !reason.trim()) { setError("Enter a cancellation reason for the scout."); return; }
    submitting.current = true;
    setBusy("cancel"); setError(null);
    try {
      await cancelBooking(booking.id, role === "OWNER" ? reason.trim() : undefined);
      setOpen(false);
      await onChanged();
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 409) {
        try { setPreview(await getCancellationPreview(booking.id)); } catch { setPreview(null); }
        setError("The cancellation terms changed while you were reviewing them. Please review the updated refund before continuing.");
      } else setError(cancellationError(failure));
    } finally {
      submitting.current = false;
      setBusy(null);
    }
  }

  const buttonLabel = booking.status === "REQUESTED" ? "Withdraw request" : booking.status === "AWAITING_PAYMENT" ? "Cancel request" : "Cancel booking";
  return <section className="mt-7 border-t border-rule pt-6">
    <div className="label">Cancellation</div>
    {booking.status === "CONFIRMED" && <PolicySchedule booking={booking} venueTimezone={venueTimezone} />}
    {!open && <button type="button" className="btn mt-4" disabled={busy !== null} onClick={() => void begin()}>{busy === "preview" ? "Checking terms…" : buttonLabel}</button>}
    {open && <div className="mt-4 border border-rule bg-paperDeep/35 p-5 md:p-6">
      <h3 className="font-display text-2xl">{booking.status === "REQUESTED" ? "Withdraw this request?" : "Cancel this booking?"}</h3>
      <p className="mt-2 text-sm text-ink/75">{venueName} · {formatDate(booking.shootDate)} · {formatTimeRange(booking.startTime, booking.endTime)}</p>
      {scoutUnpaid ? <UnpaidCopy status={booking.status} /> : preview && <PreviewCopy preview={preview} role={role} venueTimezone={venueTimezone} />}
      {role === "OWNER" && <label className="label label-ink mt-5 block">Cancellation reason<textarea className="form-input min-h-24 resize-y" maxLength={1000} required value={reason} onChange={(event) => setReason(event.target.value)} /></label>}
      <p className="mt-5 text-sm font-medium text-ink">This action is irreversible. Spring will re-evaluate the cancellation terms when you confirm.</p>
      {error && <p className="mt-4 text-sm text-ochreDeep" role="alert">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="btn" disabled={busy !== null} onClick={() => { setOpen(false); setError(null); }}>Keep booking</button><button type="button" className="btn btn-ochre" disabled={busy !== null || (!scoutUnpaid && !preview?.canCancel) || (role === "OWNER" && !reason.trim())} onClick={() => void confirm()}>{busy === "cancel" ? "Cancelling…" : finalButtonLabel(preview, buttonLabel)}</button></div>
    </div>}
    {!open && error && <p className="mt-3 text-sm text-ochreDeep" role="alert">{error}</p>}
  </section>;
}

function PolicySchedule({ booking, venueTimezone }: { booking: Booking; venueTimezone: string | null }) {
  const rows = [
    booking.gracePeriodEndsAt ? ["Grace period until", booking.gracePeriodEndsAt] : null,
    booking.fullRefundUntil ? ["Full refund until", booking.fullRefundUntil] : null,
    booking.partialRefundUntil ? [booking.partialRefundPercentage === null ? "Partial refund until" : `${booking.partialRefundPercentage}% refund until`, booking.partialRefundUntil] : null,
  ].filter((row): row is [string, string] => row !== null);
  if (rows.length === 0) return null;
  return <div className="mt-4"><p className="text-xs leading-relaxed text-taupe">Policy schedule only. Use “Cancel booking” for Spring’s current authoritative outcome.{venueTimezone ? ` Times are shown in ${venueTimezone}.` : " Times are shown in your device timezone because the booking contract has no venue timezone."}</p><dl className="mt-3 grid gap-3 sm:grid-cols-3">{rows.map(([label, value]) => <Amount key={label} label={label} value={formatTimestamp(value, venueTimezone ?? undefined)} />)}</dl></div>;
}

function UnpaidCopy({ status }: { status: Booking["status"] }) {
  return <p className="mt-5 text-sm leading-relaxed text-ink/80">{status === "REQUESTED" ? "This request has not been accepted or paid. Withdrawing it will not create a refund." : "No payment has been completed, so no refund is required."}</p>;
}

function PreviewCopy({ preview, role, venueTimezone }: { preview: CancellationPreview; role: string | null; venueTimezone: string | null }) {
  if (!preview.canCancel) return null;
  return <div className="mt-5">
    <p className="text-sm leading-relaxed text-ink/80">{role === "OWNER" ? "The scout will receive a full refund. You will receive no payout for this booking." : preview.refundPercentage === 100 ? `You will receive a refund of ${formatEur(preview.refundAmountEur)}.` : preview.refundPercentage === 0 ? "This booking is now inside the non-refundable cancellation window." : "The current cancellation terms provide a partial refund."}</p>
    <dl className="mt-4 grid gap-4 sm:grid-cols-2"><Amount label="Refund" value={formatEur(preview.refundAmountEur)} /><Amount label="Refund percentage" value={`${preview.refundPercentage}%`} />{preview.retainedAmountEur > 0 && <Amount label="Non-refundable amount" value={formatEur(preview.retainedAmountEur)} />}{preview.policyTier && <Amount label="Policy result" value={policyLabel(preview.policyTier)} />}{preview.cancellationDeadline && <Amount label="Policy deadline" value={`${formatTimestamp(preview.cancellationDeadline, venueTimezone ?? undefined)}${venueTimezone ? ` (${venueTimezone})` : " (your device timezone)"}`} />}</dl>
  </div>;
}

function Amount({ label, value }: { label: string; value: string }) { return <div><dt className="label">{label}</dt><dd className="mt-1 font-mono text-sm text-ink">{value}</dd></div>; }

function policyLabel(tier: CancellationPolicyTier): string {
  return ({ PRE_PAYMENT_WITHDRAWAL: "Pre-payment withdrawal", GRACE_PERIOD: "Grace-period full refund", FLEXIBLE_FULL_REFUND: "Full refund", PARTIAL_REFUND: "Partial refund", NON_REFUNDABLE: "Non-refundable", OWNER_FULL_REFUND: "Owner cancellation — full refund", ADMIN_FULL_REFUND: "Eema cancellation — full refund" })[tier];
}

function finalButtonLabel(preview: CancellationPreview | null, fallback: string): string { return preview?.refundPercentage === 0 ? "Cancel without refund" : `Confirm ${fallback.toLowerCase()}`; }

function cancellationError(error: unknown): string {
  if (!(error instanceof ApiError) || error.code === "NETWORK") return "Temporary connection problem. The booking has not been changed.";
  if (error.status === 401) return "Your session has expired. Please sign in again.";
  if (error.status === 403) return "You are not authorized to cancel this booking.";
  if (error.status === 404) return "This booking could not be found.";
  if (error.status === 409) return "The booking state or cancellation terms changed. Refresh and review the latest terms.";
  if (error.status >= 500) return "Cancellation could not be completed. The booking has not been locally changed.";
  return "Cancellation could not be completed. Review the booking and try again.";
}
