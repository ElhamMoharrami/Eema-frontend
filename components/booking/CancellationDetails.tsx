import { formatEur, formatTimestamp } from "@/lib/format";
import type { ActorType, Booking, CancellationPolicyTier } from "@/types/booking";

export default function CancellationDetails({ booking, venueTimezone }: { booking: Booking; venueTimezone?: string | null }) {
  if (booking.status !== "CANCELLED") return null;
  return <section className="mt-6 border border-rule bg-paperDeep/35 p-5">
    <div className="label label-ochre">Cancellation details</div>
    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
      {booking.cancelledByActorType && <Row label="Cancelled by" value={actorLabel(booking.cancelledByActorType)} />}
      {booking.cancellationPolicyTier && <Row label="Policy result" value={policyLabel(booking.cancellationPolicyTier)} />}
      {booking.cancellationRefundPercentage !== null && <Row label="Refund percentage" value={`${booking.cancellationRefundPercentage}%`} mono />}
      {booking.cancellationRefundAmountEur !== null && <Row label="Refund amount" value={formatEur(booking.cancellationRefundAmountEur)} mono />}
      {booking.cancellationRetainedAmountEur !== null && <Row label="Non-refundable amount" value={formatEur(booking.cancellationRetainedAmountEur)} mono />}
      {booking.cancelledAt && <Row label="Cancelled" value={`${formatTimestamp(booking.cancelledAt, venueTimezone ?? undefined)}${venueTimezone ? ` (${venueTimezone})` : ""}`} />}
      {booking.cancellationReason && <Row label="Reason" value={booking.cancellationReason} />}
    </dl>
    {booking.refundStatus === "NONE" && <p className="mt-4 text-sm text-ink/75">{booking.cancellationRefundAmountEur === 0 ? "No refund was required." : "No provider refund is currently recorded."}</p>}
  </section>;
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div><dt className="label">{label}</dt><dd className={mono ? "mt-1 font-mono text-sm" : "mt-1 text-sm"}>{value}</dd></div>; }
function actorLabel(actor: ActorType): string { return ({ SCOUT: "Guest/Scout", OWNER: "Venue owner", ADMIN: "Eema", SYSTEM: "Eema system", WEBHOOK: "Payment system" })[actor]; }
function policyLabel(tier: CancellationPolicyTier): string { return ({ PRE_PAYMENT_WITHDRAWAL: "Pre-payment withdrawal", GRACE_PERIOD: "Grace-period full refund", FLEXIBLE_FULL_REFUND: "Full refund", PARTIAL_REFUND: "Partial refund", NON_REFUNDABLE: "Non-refundable", OWNER_FULL_REFUND: "Owner cancellation — full refund", ADMIN_FULL_REFUND: "Eema cancellation — full refund" })[tier]; }
