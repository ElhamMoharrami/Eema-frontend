"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { formatTimestamp } from "@/lib/format";
import type { Booking } from "@/types/booking";

export default function BookingWorkflowNotice({ booking }: { booking: Booking }) {
  const { role } = useAuth();
  let heading: string | null = null;
  let message: string | null = null;

  if (role === "SCOUT") {
    if (booking.status === "REQUESTED") { heading = "Waiting for owner"; message = "Your request was sent and is not yet confirmed."; }
    else if (booking.status === "DECLINED") { heading = "Owner declined this request"; message = "No payment was created for this request."; }
    else if (booking.status === "AWAITING_PAYMENT") { heading = "Request accepted — payment required"; message = booking.paymentExpiresAt ? `Pay before ${formatTimestamp(booking.paymentExpiresAt)}.` : "Complete payment to confirm the booking."; }
    else if (booking.status === "CONFIRMED") { heading = "Booking confirmed"; message = "Payment was received and the booking is confirmed."; }
    else if (booking.status === "EXPIRED") { heading = "Payment window expired"; message = "This accepted request can no longer be paid."; }
  } else if (role === "OWNER" && booking.status === "REQUESTED") {
    heading = "New booking request"; message = "Review the shoot details and accept or decline this request.";
  }

  if (!heading) return null;
  return <div className="mt-6 border-l-2 border-ochre bg-paperDeep/30 px-5 py-4"><div className="label label-ochre">{heading}</div>{message && <p className="mt-2 text-sm leading-relaxed text-ink/75">{message}</p>}</div>;
}
