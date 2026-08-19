"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { declineAvailabilityInquiry, getOwnedVenueInquiries, offerAvailabilityInquiry } from "@/lib/api/inquiries";
import { apiErrorMessage } from "@/lib/api/error-message";
import { formatDate } from "@/lib/format";
import type { AvailabilityInquiry } from "@/types/inquiry";

export default function OwnerInquiriesPage() {
  return <DashboardShell eyebrow="Owner dashboard" title="Availability inquiries" intro="Review scout requests for one-off times without changing regular venue availability."><RoleGuard role="OWNER"><OwnerInquiries /></RoleGuard></DashboardShell>;
}

function OwnerInquiries() {
  const [items, setItems] = useState<AvailabilityInquiry[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() { setState("loading"); try { setItems(await getOwnedVenueInquiries()); setState("ready"); } catch (reason) { setError(apiErrorMessage(reason)); setState("error"); } }
  if (state === "loading") return <LoadingState label="Loading venue inquiries…" />;
  if (state === "error") return <ErrorState message={error} onRetry={() => void load()} />;
  if (items.length === 0) return <EmptyState title="No availability inquiries" message="Scout questions about unavailable times will appear here." />;
  return <div className="grid gap-6">{items.map((item) => <OwnerInquiryCard key={item.id} item={item} onChanged={load} />)}</div>;
}

function OwnerInquiryCard({ item, onChanged }: { item: AvailabilityInquiry; onChanged: () => Promise<void> }) {
  const [different, setDifferent] = useState(false);
  const [date, setDate] = useState(item.requestedDate);
  const [startTime, setStartTime] = useState(time(item.requestedStartTime));
  const [endTime, setEndTime] = useState(time(item.requestedEndTime));
  const [busy, setBusy] = useState<"decline" | "offer" | null>(null);
  const [error, setError] = useState("");
  async function decline() { setBusy("decline"); setError(""); try { await declineAvailabilityInquiry(item.id); await onChanged(); } catch (reason) { setError(apiErrorMessage(reason)); setBusy(null); } }
  async function offer(offeredDate = date, offeredStartTime = startTime, offeredEndTime = endTime) { if (offeredStartTime >= offeredEndTime) { setError("End time must be after start time."); return; } setBusy("offer"); setError(""); try { await offerAvailabilityInquiry(item.id, { offeredDate, offeredStartTime, offeredEndTime }); await onChanged(); } catch (reason) { setError(apiErrorMessage(reason)); setBusy(null); } }
  return <article className="border border-rule bg-paper p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="label label-ochre">{ownerStatus(item)}</div><h2 className="mt-2 font-display text-2xl">{item.venueName}</h2></div><span className="font-mono text-xs text-taupe">Scout {item.scoutId}</span></div><div className="mt-5 grid gap-5 border-t border-rule pt-5 sm:grid-cols-2"><Detail label="Requested time" value={`${formatDate(item.requestedDate)} · ${time(item.requestedStartTime)}–${time(item.requestedEndTime)}`} /><Detail label="Timezone" value={item.timezone} /></div><div className="mt-5"><div className="label">Message</div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{item.message}</p></div>{item.status === "OPEN" && <div className="mt-6 border-t border-rule pt-5">{different && <div className="mb-5 grid gap-4 sm:grid-cols-3"><label className="label label-ink">Offer date<input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="label label-ink">Start<input className="form-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label><label className="label label-ink">End<input className="form-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label></div>}<div className="flex flex-wrap gap-3"><button type="button" className="btn btn-ochre" disabled={busy !== null} onClick={() => different ? void offer() : void offer(item.requestedDate, time(item.requestedStartTime), time(item.requestedEndTime))}>{busy === "offer" ? "Offering…" : different ? "Send different-time offer" : "Offer this time"}</button><button type="button" className="btn" disabled={busy !== null} onClick={() => setDifferent((value) => !value)}>{different ? "Use requested time" : "Offer different time"}</button><button type="button" className="btn" disabled={busy !== null} onClick={() => void decline()}>{busy === "decline" ? "Declining…" : "Decline"}</button></div></div>}{item.offeredDate && <p className="mt-5 border-l-2 border-ochre pl-4 text-sm">Offered {formatDate(item.offeredDate)} · {time(item.offeredStartTime ?? "")}–{time(item.offeredEndTime ?? "")} · {item.timezone}</p>}{error && <p className="mt-4 text-sm text-ochreDeep">{error}</p>}</article>;
}

function ownerStatus(item: AvailabilityInquiry) { return ({ OPEN: "Awaiting response", DECLINED: "Declined", OFFERED: "Offer sent", EXPIRED: "Offer expired", ACCEPTED: "Offer accepted" } as const)[item.status]; }
function Detail({ label, value }: { label: string; value: string }) { return <div><div className="label">{label}</div><div className="mt-1 text-sm">{value}</div></div>; }
function time(value: string) { return value.slice(0, 5); }
