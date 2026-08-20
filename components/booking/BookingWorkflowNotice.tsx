"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPaymentWindowExpiry } from "@/lib/booking-lifecycle";
import { formatTimestamp } from "@/lib/format";
import type { Booking } from "@/types/booking";

export default function BookingWorkflowNotice({ booking }: { booking: Booking }) {
  const { role } = useAuth();
  let heading: string | null = null;
  let message: string | null = null;

  if (role === "SCOUT") {
    if (booking.status === "REQUESTED") { heading = "Waiting for owner response"; message = `This request does not reserve the venue yet.${booking.ownerResponseExpiresAt ? ` Owner response expected by ${formatTimestamp(booking.ownerResponseExpiresAt)}.` : ""}`; }
    else if (booking.status === "UNAVAILABLE") { heading = "This time is no longer available"; message = "Another booking reserved this time before your request was accepted. You can choose another available time."; }
    else if (booking.status === "DECLINED") { heading = "The owner declined this request"; message = "You can return to the venue and choose another available time."; }
    else if (booking.status === "AWAITING_PAYMENT") { heading = "Request accepted — payment required"; message = booking.paymentExpiresAt ? `Pay before ${formatTimestamp(booking.paymentExpiresAt)}.` : "Complete payment to confirm the booking."; }
    else if (booking.status === "CONFIRMED") { heading = "Booking confirmed"; message = "Payment was received and the booking is confirmed."; }
    else if (booking.status === "CANCELLED") { heading = "Booking cancelled"; message = "This booking has been cancelled."; }
    else if (booking.status === "REFUNDED") { heading = "Booking refunded"; message = "This booking has been refunded. See the refund details for its authoritative state."; }
    else if (booking.status === "EXPIRED" && isPaymentWindowExpiry(booking)) { heading = "Payment window expired"; message = "This accepted request can no longer be paid because the payment deadline passed."; }
    else if (booking.status === "EXPIRED") { heading = "Response window expired"; message = "This request expired because the owner did not respond before the response window ended."; }
  } else if (role === "OWNER") {
    if (booking.status === "REQUESTED") { heading = "New request"; message = booking.ownerResponseExpiresAt ? `Respond by ${formatTimestamp(booking.ownerResponseExpiresAt)}. Review the shoot details and accept or decline this request.` : "Review the shoot details and accept or decline this request."; }
    else if (booking.status === "AWAITING_PAYMENT") { heading = "Accepted — waiting for scout payment"; message = booking.paymentExpiresAt ? `The venue is reserved until ${formatTimestamp(booking.paymentExpiresAt)} while the scout completes payment.` : "The venue is reserved while the scout completes payment."; }
    else if (booking.status === "CONFIRMED") { heading = "Booking confirmed"; message = "Payment has been authoritatively received. No further owner approval is required."; }
  }

  if (!heading) return null;
  const canChooseAnotherTime = role === "SCOUT" && (booking.status === "UNAVAILABLE" || booking.status === "DECLINED" || booking.status === "EXPIRED");
  return <div className="mt-6 border-l-2 border-ochre bg-paperDeep/30 px-5 py-4"><div className="label label-ochre">{heading}</div>{message && <p className="mt-2 text-sm leading-relaxed text-ink/75">{message}</p>}{canChooseAnotherTime && <Link href="/" className="btn mt-4 inline-block">Choose another time</Link>}</div>;
}
