"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { acceptAvailabilityInquiry, getMyAvailabilityInquiries } from "@/lib/api/inquiries";
import { apiErrorMessage } from "@/lib/api/error-message";
import { saveBookingNavigation } from "@/lib/auth/booking-navigation";
import { formatDate, formatTimestamp } from "@/lib/format";
import type { AvailabilityInquiry, AvailabilityInquiryStatus } from "@/types/inquiry";

const STATUS: Record<AvailabilityInquiryStatus, string> = { OPEN: "Waiting for owner", DECLINED: "Owner declined", OFFERED: "Owner offered another time", EXPIRED: "Offer expired", ACCEPTED: "Offer accepted" };

export default function ScoutInquiriesPage() {
  return <DashboardShell eyebrow="Scout dashboard" title="Availability inquiries" intro="Track questions about times outside a venue's regular availability."><RoleGuard role="SCOUT"><ScoutInquiries /></RoleGuard></DashboardShell>;
}

function ScoutInquiries() {
  const router = useRouter();
  const [items, setItems] = useState<AvailabilityInquiry[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() { setState("loading"); try { setItems(await getMyAvailabilityInquiries()); setState("ready"); } catch (reason) { setError(apiErrorMessage(reason)); setState("error"); } }
  async function accept(item: AvailabilityInquiry) { setBusy(item.id); setError(""); try { const booking = await acceptAvailabilityInquiry(item.id); saveBookingNavigation(booking.id); router.push(`/bookings/${booking.id}`); } catch (reason) { setError(apiErrorMessage(reason)); setBusy(null); await load(); } }
  if (state === "loading") return <LoadingState label="Loading your inquiries…" />;
  if (state === "error") return <ErrorState message={error} onRetry={() => void load()} />;
  if (items.length === 0) return <EmptyState title="No availability inquiries" message="When a venue is unavailable, you can ask its owner about a one-off time." />;
  return <div className="grid gap-6">{error && <p className="text-sm text-ochreDeep">{error}</p>}{items.map((item) => <article key={item.id} className="border border-rule bg-paper p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="label label-ochre">{STATUS[item.status]}</div><h2 className="mt-2 font-display text-2xl">{item.venueName}</h2></div><span className="font-mono text-xs text-taupe">{item.id}</span></div><div className="mt-5 grid gap-5 border-t border-rule pt-5 sm:grid-cols-2"><Detail label="Requested" value={`${formatDate(item.requestedDate)} · ${time(item.requestedStartTime)}–${time(item.requestedEndTime)}`} /><Detail label="Timezone" value={item.timezone} /></div><p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{item.message}</p>{item.offeredDate && item.offeredStartTime && item.offeredEndTime && <div className="mt-5 border border-ochre/50 bg-paperDeep/40 p-5"><div className="label label-ochre">Owner&apos;s offer</div><p className="mt-2 text-sm">{formatDate(item.offeredDate)} · {time(item.offeredStartTime)}–{time(item.offeredEndTime)}</p><p className="mt-1 text-xs text-taupe">Times shown in {item.timezone}{item.offerExpiresAt ? ` · Expires ${formatTimestamp(item.offerExpiresAt)}` : ""}</p>{item.status === "OFFERED" && <button type="button" className="btn btn-ochre mt-4" disabled={busy === item.id} onClick={() => void accept(item)}>{busy === item.id ? "Accepting…" : "Accept offer"}</button>}</div>}{item.acceptedBookingId && <Link className="btn mt-5 inline-block" href={`/bookings/${item.acceptedBookingId}`}>Continue to booking</Link>}</article>)}</div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><div className="label">{label}</div><div className="mt-1 text-sm">{value}</div></div>; }
function time(value: string) { return value.slice(0, 5); }
