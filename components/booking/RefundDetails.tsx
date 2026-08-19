import { formatEur, formatTimestamp } from "@/lib/format";
import type { Booking, RefundStatus } from "@/types/booking";

const REFUND_COPY: Record<Exclude<RefundStatus, "NONE">, { label: string; message: string }> = {
  CREATING: { label: "Refund starting", message: "Eema is preparing the refund request." },
  QUEUED: { label: "Refund queued", message: "The refund has been queued for processing." },
  PENDING: { label: "Refund pending", message: "The refund is awaiting authoritative processing." },
  PROCESSING: { label: "Refund processing", message: "The refund is currently being processed." },
  REFUNDED: { label: "Refund completed", message: "Eema has recorded the refund as completed." },
  FAILED: { label: "Refund unsuccessful", message: "The refund could not be completed. Eema support may need to review it." },
  CANCELED: { label: "Refund canceled", message: "The refund request was canceled." },
};

export default function RefundDetails({ booking }: { booking: Booking }) {
  if (booking.refundStatus === "NONE") return null;
  const copy = REFUND_COPY[booking.refundStatus];
  return <div className="mt-6 border border-rule bg-paperDeep/40 p-5">
    <div className="label label-ochre">{copy.label}</div>
    <p className="mt-2 text-sm leading-relaxed text-ink/75">{copy.message}</p>
    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
      {booking.refundAmountEur !== null && <RefundRow label="Refund amount" value={formatEur(booking.refundAmountEur)} mono />}
      {booking.refundRequestedAt && <RefundRow label="Requested" value={formatTimestamp(booking.refundRequestedAt)} />}
      {booking.refundedAt && <RefundRow label="Refunded" value={formatTimestamp(booking.refundedAt)} />}
    </dl>
  </div>;
}

function RefundRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="label">{label}</dt><dd className={mono ? "mt-1 break-all font-mono text-sm" : "mt-1 text-sm"}>{value}</dd></div>;
}
