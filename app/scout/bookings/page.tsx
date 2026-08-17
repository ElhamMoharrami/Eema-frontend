"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import BookingCard from "@/components/booking/BookingCard";
import DashboardShell from "@/components/layout/DashboardShell";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { apiErrorMessage } from "@/lib/api/error-message";
import { getBookings } from "@/lib/api/bookings";
import { getVenues } from "@/lib/api/venues";
import type { Booking } from "@/types/booking";

export default function ScoutBookingsPage() {
  return <DashboardShell eyebrow="Scout dashboard" title="My bookings" intro="Track payment and owner-confirmation status for your shoots."><RoleGuard role="SCOUT"><ScoutBookings /></RoleGuard></DashboardShell>;
}

function ScoutBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venueNames, setVenueNames] = useState<Record<string, string>>({});
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, []);
  async function load() {
    setState("loading");
    try {
      const loaded = await getBookings();
      setBookings(loaded);
      try {
        const venues = await getVenues();
        setVenueNames(Object.fromEntries(venues.map((venue) => [venue.id, venue.name])));
      } catch {
        setVenueNames({});
      }
      setState("ready");
    } catch (reason) {
      setError(apiErrorMessage(reason));
      setState("error");
    }
  }

  if (state === "loading") return <LoadingState label="Loading your bookings…" />;
  if (state === "error") return <ErrorState message={error} onRetry={() => void load()} />;
  if (bookings.length === 0) return <EmptyState title="No bookings yet" message="Bookings you create from the marketplace will appear here." />;
  return <div className="grid gap-6">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} venueName={venueNames[booking.venueId] ?? `Venue ${booking.venueId}`} />)}</div>;
}
