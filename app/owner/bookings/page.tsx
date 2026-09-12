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
import { getMyVenues } from "@/lib/api/venues";
import type { Booking } from "@/types/booking";

export default function OwnerBookingsPage() {
  return <DashboardShell eyebrow="Owner dashboard" title="Venue bookings" intro="Review new requests, accept or decline them, and track confirmed bookings."><RoleGuard role="OWNER"><OwnerBookings /></RoleGuard></DashboardShell>;
}

function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venueNames, setVenueNames] = useState<Record<string, string>>({});
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() {
    setState("loading");
    const [bookingResult, venueResult] = await Promise.allSettled([getBookings(), getMyVenues()]);
    if (bookingResult.status === "rejected") {
      setError(apiErrorMessage(bookingResult.reason, "OWNER"));
      setState("error");
      return;
    }
    setBookings(prioritizeRequestedBookings(bookingResult.value));
    setVenueNames(venueResult.status === "fulfilled" ? Object.fromEntries(venueResult.value.map((venue) => [venue.id, venue.name])) : {});
    setState("ready");
  }
  if (state === "loading") return <LoadingState label="Loading venue bookings…" />;
  if (state === "error") return <ErrorState message={error} onRetry={() => void load()} />;
  if (bookings.length === 0) return <EmptyState title="No venue bookings" message="Bookings for your venues will appear here." />;
  return <div className="grid gap-6">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} venueName={venueNames[booking.venueId] ?? `Venue ${booking.venueId}`} financialView="owner" onChanged={load} />)}</div>;
}

function prioritizeRequestedBookings(bookings: Booking[]): Booking[] {
  const requested = bookings
    .filter((booking) => booking.status === "REQUESTED")
    .sort((left, right) => deadlineValue(left.ownerResponseExpiresAt) - deadlineValue(right.ownerResponseExpiresAt));
  const others = bookings.filter((booking) => booking.status !== "REQUESTED");
  return [...requested, ...others];
}

function deadlineValue(deadline: string | null): number {
  if (!deadline) return Number.POSITIVE_INFINITY;
  const value = new Date(deadline).getTime();
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}
