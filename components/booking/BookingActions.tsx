"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiErrorMessage } from "@/lib/api/error-message";
import { ApiError } from "@/lib/api/client";
import { acceptBookingRequest, declineBookingRequest } from "@/lib/api/bookings";
import { createCheckout } from "@/lib/api/checkout";
import { saveBookingNavigation } from "@/lib/auth/booking-navigation";
import type { Booking } from "@/types/booking";

type Action = "accept" | "decline" | "pay";

export default function BookingActions({ booking, onChanged }: { booking: Booking; onChanged: () => void | Promise<void> }) {
  const { role } = useAuth();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canReview = role === "OWNER" && booking.status === "REQUESTED";
  const canPay = role === "SCOUT" && booking.status === "AWAITING_PAYMENT";

  if (!canReview && !canPay) return null;

  async function run(action: Action) {
    if (busy) return;
    setBusy(action); setError(null);
    try {
      if (action === "pay") {
        const checkout = await createCheckout(booking.id);
        saveBookingNavigation(booking.id);
        window.location.assign(checkout.checkoutUrl);
        return;
      }
      if (action === "accept") await acceptBookingRequest(booking.id);
      else await declineBookingRequest(booking.id);
      await onChanged();
    } catch (reason) {
      if (action === "accept" && reason instanceof ApiError && reason.status === 409) {
        setError("This time is no longer available. Another booking may have reserved it.");
        setBusy(null);
        await onChanged();
        return;
      }
      setError(apiErrorMessage(reason)); setBusy(null);
    }
  }

  return <div className="mt-6 border-t border-rule pt-5">
    <div className="flex flex-wrap gap-3">
      {canReview && <><button type="button" className="btn btn-ochre" disabled={busy !== null} onClick={() => void run("accept")}>{busy === "accept" ? "Accepting…" : "Accept request"}</button><button type="button" className="btn" disabled={busy !== null} onClick={() => void run("decline")}>{busy === "decline" ? "Declining…" : "Decline request"}</button></>}
      {canPay && <button type="button" className="btn btn-ochre" disabled={busy !== null} onClick={() => void run("pay")}>{busy === "pay" ? "Opening Mollie…" : "Pay now"}</button>}
    </div>
    {error && <p className="mt-3 text-sm text-ochreDeep">{error}</p>}
  </div>;
}
