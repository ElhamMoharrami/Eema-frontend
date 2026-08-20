"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthPanel from "@/components/auth/AuthPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import AppHeader from "@/components/layout/AppHeader";
import BookingActions from "@/components/booking/BookingActions";
import BookingWorkflowNotice from "@/components/booking/BookingWorkflowNotice";
import RefundDetails from "@/components/booking/RefundDetails";
import StatusBadge from "@/components/ui/StatusBadge";
import { ApiError } from "@/lib/api/client";
import { apiErrorMessage } from "@/lib/api/error-message";
import { getBooking } from "@/lib/api/bookings";
import { getVenues } from "@/lib/api/venues";
import { getBookingNavigation } from "@/lib/auth/booking-navigation";
import { formatDate, formatEur, formatTimestamp } from "@/lib/format";
import { isPaymentWindowExpiry } from "@/lib/booking-lifecycle";
import type { Booking, BookingStatus } from "@/types/booking";

type ViewState = "loading" | "auth" | "missing" | "not-found" | "error" | "ready";

export default function BookedPage() {
  const auth = useAuth();
  const [state, setState] = useState<ViewState>("loading");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.isAuthReady) return;
    const navigation = getBookingNavigation();
    setBookingId(navigation);
    if (!navigation) {
      setState("missing");
      return;
    }
    if (!auth.user) {
      setBooking(null);
      setState("auth");
      return;
    }
    void loadBooking(navigation);
  }, [auth.isAuthReady, auth.user]);

  const loadBooking = async (id: string) => {
    setState("loading");
    try {
      const found = await getBooking(id);
      setBooking(found);
      try {
        const venues = await getVenues();
        setVenueName(venues.find((venue) => venue.id === found.venueId)?.name ?? null);
      } catch {
        setVenueName(null);
      }
      setState("ready");
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        setBooking(null);
        setState("auth");
        return;
      }
      if (reason instanceof ApiError && reason.status === 404) {
        setBooking(null);
        setState("not-found");
        return;
      }
      setError(apiErrorMessage(reason));
      setState("error");
    }
  };

  return <main className="mx-auto w-full max-w-[900px] px-6 pt-10 pb-24 md:px-12">
    <AppHeader />
    <header className="mt-14"><div className="label label-ochre">Mollie return</div><h1 className="mt-3 font-display text-4xl md:text-5xl">Booking status</h1><p className="mt-3 text-sm text-taupe">This page reads authoritative booking state from Eema. Redirect parameters are not used as payment proof.</p></header>
    <section className="mt-10 border border-rule bg-paper p-8 settle-slow md:p-12">
      {(!auth.isAuthReady || state === "loading") && <StatusBody label="Status" heading="Checking your booking…" />}
      {state === "auth" && auth.isAuthReady && <AuthPanel onAuthenticated={() => bookingId && void loadBooking(bookingId)} />}
      {state === "ready" && booking && auth.user && <BookingView booking={booking} venueName={venueName} onRecheck={() => void loadBooking(booking.id)} />}
      {state === "missing" && <StatusBody label="No booking in progress" heading="Nothing to confirm here." message="Return to the marketplace to start a booking." />}
      {state === "not-found" && <StatusBody label="Booking unavailable" heading="We couldn't find this booking in your account." message="Make sure you are signed in with the account that created it." />}
      {state === "error" && <StatusBody label="Could not load booking" heading={error} action={bookingId ? <button onClick={() => void loadBooking(bookingId)} className="btn mt-6">Try again</button> : undefined} />}
    </section>
  </main>;
}

function BookingView({ booking, venueName, onRecheck }: { booking: Booking; venueName: string | null; onRecheck: () => void }) {
  const content: Record<BookingStatus, { heading: string; message: string }> = {
    REQUESTED: { heading: "Waiting for owner response.", message: `This request does not reserve the venue yet.${booking.ownerResponseExpiresAt ? ` Owner response expected by ${formatTimestamp(booking.ownerResponseExpiresAt)}.` : ""}` },
    AWAITING_PAYMENT: { heading: "Payment confirmation is still processing.", message: "Eema is checking the authoritative payment state. The booking has not been locally promoted." },
    DECLINED: { heading: "The request was declined.", message: "The venue owner declined this booking request." },
    EXPIRED: isPaymentWindowExpiry(booking)
      ? { heading: "The payment window expired.", message: "The accepted request can no longer be paid because its payment deadline passed." }
      : { heading: "The response window expired.", message: "The owner did not respond before the response deadline." },
    UNAVAILABLE: { heading: "This time is no longer available.", message: "Another booking reserved this time before your request was accepted." },
    CONFIRMED: { heading: "Your booking is confirmed.", message: "Payment has been authoritatively received and the booking is confirmed." },
    CANCELLED: { heading: "This booking has been cancelled.", message: "The authoritative booking record is marked as cancelled." },
    REFUNDED: booking.refundStatus === "REFUNDED"
      ? { heading: "This booking has been refunded.", message: "Eema has recorded the authoritative refund as completed." }
      : { heading: "Refund information is available.", message: "See the authoritative refund state below for the latest details." },
  };
  const copy = content[booking.status];
  return <>
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="label label-ink">Authoritative Eema status</div><StatusBadge kind="booking" status={booking.status} /></div>
    <h2 className="mt-5 font-display text-4xl leading-[1.05]">{copy.heading}</h2><p className="mt-4 text-[1.02rem] leading-relaxed text-ink/85">{copy.message}</p>
    <BookingWorkflowNotice booking={booking} />
    <div className="mt-8 grid gap-5 border-t border-rule pt-6 sm:grid-cols-2">
      <Detail label="Venue" value={venueName ?? booking.venueId} />
      <Detail label="Shoot date" value={formatDate(booking.shootDate)} />
      <Detail label="Authoritative booking price" value={formatEur(booking.venuePriceEur)} mono />
      <Detail label="Total paid" value={formatEur(booking.totalPaidEur)} mono />
      <Detail label="Created" value={formatTimestamp(booking.createdAt)} />
      <Detail label="Paid at" value={formatTimestamp(booking.paidAt)} />
      <Detail label="Confirmed at" value={formatTimestamp(booking.confirmedAt)} />
      <Detail label="Cancelled at" value={formatTimestamp(booking.cancelledAt)} />
      <Detail label="Booking reference" value={booking.id} mono />
    </div>
    <div className="mt-8 grid gap-6 border-t border-rule pt-6 sm:grid-cols-2"><Contact label="Scout contact" contact={booking.scoutContact} /><Contact label="Owner contact" contact={booking.ownerContact} /></div>
    <RefundDetails booking={booking} />
    <BookingActions booking={booking} onChanged={onRecheck} />
    <div className="mt-8 flex flex-wrap gap-3">{booking.status === "AWAITING_PAYMENT" && <button onClick={onRecheck} className="btn">Check payment status</button>}<Link href="/scout/bookings" className="btn inline-block">My bookings</Link><Link href="/" className="btn inline-block">Marketplace</Link></div>
  </>;
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div><div className="label">{label}</div><div className={mono ? "mt-1 break-all font-mono text-sm" : "mt-1 text-sm"}>{value}</div></div>; }
function Contact({ label, contact }: { label: string; contact: Booking["scoutContact"] }) { return <div><div className="label">{label}</div><p className="mt-2 text-sm">{contact.name}</p><p className="mt-1 break-all text-sm text-taupe">{contact.email}</p>{contact.phone && <p className="mt-1 text-sm text-taupe">{contact.phone}</p>}</div>; }
function StatusBody({ label, heading, message, action }: { label: string; heading: string; message?: string; action?: React.ReactNode }) { return <><div className="label label-ink">{label}</div><h2 className="mt-5 font-display text-3xl leading-[1.1]">{heading}</h2>{message && <p className="mt-4 text-sm leading-relaxed text-taupe">{message}</p>}{action}<div><Link href="/" className="btn mt-6 inline-block">Back to Eema</Link></div></>; }
