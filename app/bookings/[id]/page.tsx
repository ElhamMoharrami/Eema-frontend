"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AuthPanel from "@/components/auth/AuthPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import BookingActions from "@/components/booking/BookingActions";
import BookingWorkflowNotice from "@/components/booking/BookingWorkflowNotice";
import PaymentStateNotice from "@/components/booking/PaymentStateNotice";
import RefundDetails from "@/components/booking/RefundDetails";
import AppHeader from "@/components/layout/AppHeader";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import StatusBadge from "@/components/ui/StatusBadge";
import { getBooking } from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import { apiErrorMessage } from "@/lib/api/error-message";
import { isPaymentWindowExpiry } from "@/lib/booking-lifecycle";
import { getVenue } from "@/lib/api/venues";
import { formatDate, formatEur, formatTimeRange, formatTimestamp } from "@/lib/format";
import type { Booking } from "@/types/booking";

type LoadState = "idle" | "loading" | "ready" | "forbidden" | "not-found" | "expired" | "error";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const auth = useAuth();
  const bookingId = params.id;
  const validId = UUID_PATTERN.test(bookingId);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth.user || !validId) return;
    setState("loading");
    setError("");
    try {
      const loaded = await getBooking(bookingId);
      setBooking(loaded);
      setState("ready");

      // Venue metadata is decorative: the booking remains usable if it is unavailable.
      try {
        const venue = await getVenue(loaded.venueId);
        setVenueName(venue.name);
      } catch {
        setVenueName(null);
      }
    } catch (reason) {
      setBooking(null);
      if (reason instanceof ApiError && reason.status === 401) setState("expired");
      else if (reason instanceof ApiError && reason.status === 403) setState("forbidden");
      else if (reason instanceof ApiError && reason.status === 404) setState("not-found");
      else {
        setError(apiErrorMessage(reason));
        setState("error");
      }
    }
  }, [auth.user, bookingId, validId]);

  useEffect(() => {
    if (auth.isAuthReady && auth.user && validId) void load();
  }, [auth.isAuthReady, auth.user, load, validId]);

  const dashboardHref = auth.role === "OWNER" ? "/owner/bookings" : "/scout/bookings";
  const dashboardLabel = auth.role === "OWNER" ? "Venue bookings" : "My bookings";

  return <main className="mx-auto w-full max-w-[1200px] px-6 pt-10 pb-24 md:px-12">
    <AppHeader />
    <div className="mt-10 flex flex-wrap gap-3">
      <Link href="/" className="btn">Back to Marketplace</Link>
      {(auth.role === "SCOUT" || auth.role === "OWNER") && <Link href={dashboardHref} className="btn">Back to {dashboardLabel}</Link>}
    </div>
    <span className="rule my-10" aria-hidden />

    {!auth.isAuthReady && <LoadingState label="Checking your account…" />}

    {auth.isAuthReady && !validId && <ErrorState title="Invalid booking link" message="This booking reference is malformed. Check the link in your email or return to your bookings." />}

    {auth.isAuthReady && validId && !auth.user && <div className="mx-auto max-w-[560px]">
      {state === "expired" && <p className="mb-5 border-l-2 border-ochre pl-4 text-sm text-ink/75">Your session has expired. Sign in again to view this booking.</p>}
      <AuthPanel onAuthenticated={() => undefined} />
    </div>}

    {auth.isAuthReady && auth.user && (state === "idle" || state === "loading") && <LoadingState label="Loading booking details…" />}
    {auth.isAuthReady && auth.user && state === "forbidden" && <ErrorState title="Booking not available" message="You do not have permission to view this booking. Spring verifies access using your account." />}
    {auth.isAuthReady && auth.user && state === "not-found" && <ErrorState title="Booking not found" message="This booking does not exist, or it is no longer available." />}
    {auth.isAuthReady && auth.user && state === "expired" && <ErrorState title="Session expired" message="Your session has expired. Please sign in again." />}
    {auth.isAuthReady && auth.user && state === "error" && <ErrorState title="Could not load booking" message={error} onRetry={() => void load()} />}
    {auth.isAuthReady && auth.user && state === "ready" && booking && <BookingDetail booking={booking} venueName={venueName} role={auth.role} onChanged={load} />}
  </main>;
}

function BookingDetail({ booking, venueName, role, onChanged }: { booking: Booking; venueName: string | null; role: string | null; onChanged: () => Promise<void> }) {
  const ownerView = role === "OWNER";
  return <article className="border border-rule bg-paper p-6 md:p-9">
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <div className="label label-ochre">Booking reference</div>
        <p className="mt-2 break-all font-mono text-sm text-taupe">{booking.id}</p>
        <h1 className="mt-5 font-display text-4xl leading-tight md:text-5xl">{venueName ?? "Booked venue"}</h1>
        {!venueName && <p className="mt-2 break-all font-mono text-xs text-taupe">Venue {booking.venueId}</p>}
        <p className="mt-4 text-lg text-ink/80">{formatDate(booking.shootDate)} · {formatTimeRange(booking.startTime, booking.endTime)}</p>
      </div>
      <StatusBadge kind="booking" status={booking.status} />
    </header>

    <section className="mt-8 grid gap-5 border-t border-rule pt-6 sm:grid-cols-2 lg:grid-cols-3">
      <Detail label="Shoot date" value={formatDate(booking.shootDate)} />
      <Detail label="Time" value={formatTimeRange(booking.startTime, booking.endTime)} />
      <Detail label="Venue price" value={formatEur(booking.venuePriceEur)} mono />
      <Detail label="Total paid" value={formatEur(booking.totalPaidEur)} mono />
      {ownerView && <>
        <Detail label="Commission rate" value={`${booking.commissionPercentage}%`} mono />
        <Detail label="Eema commission" value={formatEur(booking.commissionEur)} mono />
        <Detail label="Mollie fee" value={formatEur(booking.mollieFeeEur)} mono />
        <Detail label="Fee reconciliation" value={booking.mollieFeeReconciled ? "Reconciled" : "Pending"} />
        {booking.mollieFeeReconciledAt && <Detail label="Fee reconciled at" value={formatTimestamp(booking.mollieFeeReconciledAt)} />}
        <Detail label="Owner payout" value={formatEur(booking.ownerPayoutEur)} mono />
        <Detail label="Payout status" value={booking.ownerPayoutStatus === "PAID_MANUALLY" ? "Paid manually" : "Calculated — not paid"} />
        <Detail label="Refund state" value={booking.refundStatus === "NONE" ? "No refund" : booking.refundStatus.toLowerCase().replaceAll("_", " ")} />
      </>}
    </section>

    <BookingWorkflowNotice booking={booking} />
    <BookingLifecycle booking={booking} />
    <PaymentStateNotice booking={booking} />
    <RefundDetails booking={booking} />

    {!ownerView && <section className="mt-6 border-t border-rule pt-5">
      <div className="label">Brief</div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{booking.rawBrief}</p>
    </section>}

    <section className={`mt-6 grid gap-6 border-t border-rule pt-5 ${ownerView ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
      <Contact label="Scout contact" contact={booking.scoutContact} />
      {!ownerView && <Contact label="Owner contact" contact={booking.ownerContact} />}
    </section>

    <section className="mt-6 grid gap-5 border-t border-rule pt-5 sm:grid-cols-2 lg:grid-cols-3">
      <Detail label="Created" value={formatTimestamp(booking.createdAt)} />
      {booking.paidAt && <Detail label="Paid" value={formatTimestamp(booking.paidAt)} />}
      {booking.confirmedAt && <Detail label="Confirmed" value={formatTimestamp(booking.confirmedAt)} />}
      {booking.cancelledAt && <Detail label="Cancelled" value={formatTimestamp(booking.cancelledAt)} />}
      {booking.acceptedAt && <Detail label="Accepted" value={formatTimestamp(booking.acceptedAt)} />}
      {booking.ownerResponseExpiresAt && <Detail label="Owner response deadline" value={formatTimestamp(booking.ownerResponseExpiresAt)} />}
      {booking.paymentExpiresAt && <Detail label="Payment deadline" value={formatTimestamp(booking.paymentExpiresAt)} />}
      {booking.declinedAt && <Detail label="Declined" value={formatTimestamp(booking.declinedAt)} />}
      {booking.expiredAt && <Detail label="Expired" value={formatTimestamp(booking.expiredAt)} />}
      {booking.refundedAt && <Detail label="Refunded" value={formatTimestamp(booking.refundedAt)} />}
    </section>

    <BookingActions booking={booking} onChanged={onChanged} />
  </article>;
}

function BookingLifecycle({ booking }: { booking: Booking }) {
  let steps: string[] | null = null;
  if (booking.status === "REQUESTED") steps = ["Requested", "Waiting for owner", booking.ownerResponseExpiresAt ? `Response deadline: ${formatTimestamp(booking.ownerResponseExpiresAt)}` : "Response deadline pending"];
  else if (booking.status === "AWAITING_PAYMENT") steps = ["Requested", "Owner accepted", "Payment required", booking.paymentExpiresAt ? `Payment deadline: ${formatTimestamp(booking.paymentExpiresAt)}` : "Payment deadline pending"];
  else if (booking.status === "UNAVAILABLE") steps = ["Requested", "Slot reserved by another booking"];
  else if (booking.status === "DECLINED") steps = ["Requested", "Declined by owner"];
  else if (booking.status === "EXPIRED" && isPaymentWindowExpiry(booking)) steps = ["Requested", "Owner accepted", "Payment window expired"];
  else if (booking.status === "EXPIRED") steps = ["Requested", "Response window expired"];
  if (!steps) return null;
  return <section className="mt-6 border-t border-rule pt-5"><div className="label">Booking lifecycle</div><ol className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink/80">{steps.map((step, index) => <li key={step} className="flex items-center gap-2">{index > 0 && <span aria-hidden className="text-taupe">→</span>}<span>{step}</span></li>)}</ol></section>;
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><div className="label">{label}</div><div className={mono ? "mt-1 font-mono text-sm text-ink" : "mt-1 text-sm text-ink"}>{value}</div></div>;
}

function Contact({ label, contact }: { label: string; contact: Booking["scoutContact"] }) {
  return <div><div className="label">{label}</div><p className="mt-2 text-sm text-ink">{contact.name}</p><a className="mt-1 block break-all text-sm text-ochre hover:text-ochreDeep" href={`mailto:${contact.email}`}>{contact.email}</a>{contact.phone && <a className="mt-1 block text-sm text-taupe" href={`tel:${contact.phone}`}>{contact.phone}</a>}</div>;
}
