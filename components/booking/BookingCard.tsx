import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, formatEur, formatTimeRange, formatTimestamp } from "@/lib/format";
import type { Booking } from "@/types/booking";
import BookingActions from "./BookingActions";
import RefundDetails from "./RefundDetails";
import PaymentStateNotice from "./PaymentStateNotice";

export default function BookingCard({ booking, venueName, financialView = "scout", onChanged }: { booking: Booking; venueName: string; financialView?: "scout" | "owner"; onChanged?: () => void | Promise<void> }) {
  return <article className="border border-rule bg-paper p-6 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="label">Venue</div><h2 className="mt-2 font-display text-2xl">{venueName}</h2><p className="mt-1 break-all font-mono text-xs text-taupe">{booking.venueId}</p></div><StatusBadge kind="booking" status={booking.status} /></div>
    <div className="mt-6 grid gap-5 border-t border-rule pt-5 sm:grid-cols-2 lg:grid-cols-3">
      <Detail label="Shoot date" value={formatDate(booking.shootDate)} />
      <Detail label="Time" value={formatTimeRange(booking.startTime, booking.endTime)} />
      <Detail label="Created" value={formatTimestamp(booking.createdAt)} />
      <Detail label="Venue price" value={formatEur(booking.venuePriceEur)} mono />
      <Detail label="Total paid" value={formatEur(booking.totalPaidEur)} mono />
      {financialView === "owner" && <>
        <Detail label="Commission rate" value={`${booking.commissionPercentage}%`} mono />
        <Detail label="Eema commission" value={formatEur(booking.commissionEur)} mono />
        <Detail label={`Mollie fee · ${booking.mollieFeeReconciled ? "authoritative reconciled" : "provisional"}`} value={formatEur(booking.mollieFeeEur)} mono />
        {booking.mollieFeeReconciled && booking.mollieFeeReconciledAt && <Detail label="Fee reconciled at" value={formatTimestamp(booking.mollieFeeReconciledAt)} />}
        <Detail label={ownerPayoutLabel(booking)} value={formatEur(booking.ownerPayoutEur)} mono />
      </>}
      <Detail label="Paid at" value={formatTimestamp(booking.paidAt)} />
      <Detail label="Confirmed at" value={formatTimestamp(booking.confirmedAt)} />
      <Detail label="Cancelled at" value={formatTimestamp(booking.cancelledAt)} />
    </div>
    <PaymentStateNotice booking={booking} />
    <RefundDetails booking={booking} />
    <div className="mt-6 border-t border-rule pt-5"><div className="label">Brief</div><p className="mt-2 text-sm leading-relaxed text-ink/80">{booking.rawBrief}</p></div>
    <div className="mt-6 grid gap-6 border-t border-rule pt-5 md:grid-cols-2">
      <Contact label="Scout contact" contact={booking.scoutContact} />
      <Contact label="Owner contact" contact={booking.ownerContact} />
    </div>
    {onChanged && <BookingActions booking={booking} onChanged={onChanged} />}
  </article>;
}

function ownerPayoutLabel(booking: Booking): string {
  if (booking.ownerPayoutStatus === "PAID_MANUALLY") return "Owner payout paid";
  return booking.mollieFeeReconciled
    ? "Owner payout calculated — not yet paid"
    : "Owner payout calculated — not yet paid · provisional";
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div><div className="label">{label}</div><div className={mono ? "mt-1 font-mono text-sm text-ink" : "mt-1 text-sm text-ink"}>{value}</div></div>;
}

function Contact({ label, contact }: { label: string; contact: Booking["scoutContact"] }) {
  return <div><div className="label">{label}</div><p className="mt-2 text-sm text-ink">{contact.name}</p><a className="mt-1 block break-all text-sm text-ochre hover:text-ochreDeep" href={`mailto:${contact.email}`}>{contact.email}</a>{contact.phone && <a className="mt-1 block text-sm text-taupe" href={`tel:${contact.phone}`}>{contact.phone}</a>}</div>;
}
