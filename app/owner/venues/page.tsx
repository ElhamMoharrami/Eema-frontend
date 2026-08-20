"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import StatusBadge from "@/components/ui/StatusBadge";
import VenuePhoto from "@/components/venue/VenuePhoto";
import { apiErrorMessage } from "@/lib/api/error-message";
import { getMyVenues } from "@/lib/api/venues";
import { formatDuration, formatEur } from "@/lib/format";
import { venuePhoto } from "@/lib/venue-media";
import type { Venue } from "@/types/venue";

export default function OwnerVenuesPage() {
  return <DashboardShell eyebrow="Owner dashboard" title="My venues" intro="Manage each of your listings and its availability independently."><RoleGuard role="OWNER"><OwnerVenues /></RoleGuard></DashboardShell>;
}

function OwnerVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() {
    setState("loading");
    try { setVenues(await getMyVenues()); setState("ready"); }
    catch (reason) { setError(apiErrorMessage(reason)); setState("error"); }
  }
  if (state === "loading") return <LoadingState label="Loading your venues…" />;
  if (state === "error") return <ErrorState message={error} onRetry={() => void load()} />;
  return <><div className="mb-8 flex justify-end"><Link href="/owner/venues/new" className="btn btn-ochre">Add listing</Link></div>{venues.length === 0 ? <div><EmptyState title="No venues yet" message="Create your first venue listing to configure its availability." /><div className="mt-6 text-center"><Link href="/owner/venues/new" className="btn btn-ochre">Add listing</Link></div></div> : <div className="grid gap-8 md:grid-cols-2">{venues.map((venue) => <article key={venue.id} className="border border-rule bg-paper p-5"><div className="relative overflow-hidden bg-paperDeep" style={{ aspectRatio: "4 / 3" }}><VenuePhoto src={venuePhoto(venue)} alt={venue.name} /></div><div className="mt-5 flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl">{venue.name}</h2><p className="label mt-2">{venue.neighbourhood}</p></div><StatusBadge kind="venue" status={venue.status} /></div><div className="mt-5 grid grid-cols-2 gap-4 border-t border-rule pt-4"><Metric label="Hourly rate" value={`${formatEur(venue.hourlyRateEur)}/hour`} /><Metric label="Minimum booking" value={formatDuration(venue.minimumBookingMinutes)} />{venue.fullDayRateEur !== null && <Metric label="Full-day rate" value={formatEur(venue.fullDayRateEur)} />}<Metric label="Size" value={`${venue.sizeM2} m²`} /></div><div className="mt-4 flex flex-wrap gap-2">{venue.tags.map((tag) => <span className="chip chip-static" key={tag}>{tag}</span>)}</div><Link href={`/owner/venues/${venue.id}`} className="btn mt-6 inline-block">Manage listing</Link></article>)}</div>}</>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><div className="label">{label}</div><div className="mt-1 font-mono text-sm">{value}</div></div>; }
