"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiErrorMessage } from "@/lib/api/error-message";
import { cancelBooking, confirmBooking } from "@/lib/api/bookings";
import type { Booking } from "@/types/booking";

export default function BookingActions({ booking, onChanged }: { booking: Booking; onChanged: () => void | Promise<void> }) {
  const { role } = useAuth();
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canConfirm = role === "OWNER" && booking.status === "PAID";
  const canCancel = (role === "SCOUT" || role === "OWNER") && booking.status === "PENDING";

  if (!canConfirm && !canCancel) return null;

  const run = async (action: "confirm" | "cancel") => {
    if (busy) return;
    setBusy(action);
    setError(null);
    try {
      if (action === "confirm") await confirmBooking(booking.id);
      else await cancelBooking(booking.id);
      await onChanged();
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setBusy(null);
    }
  };

  return <div className="mt-6 border-t border-rule pt-5">
    <div className="flex flex-wrap gap-3">
      {canConfirm && <button type="button" className="btn btn-ochre" disabled={busy !== null} onClick={() => void run("confirm")}>{busy === "confirm" ? "Confirming…" : "Confirm booking"}</button>}
      {canCancel && <button type="button" className="btn" disabled={busy !== null} onClick={() => void run("cancel")}>{busy === "cancel" ? "Cancelling…" : "Cancel booking"}</button>}
    </div>
    {error && <p className="mt-3 text-sm text-ochreDeep">{error}</p>}
  </div>;
}
