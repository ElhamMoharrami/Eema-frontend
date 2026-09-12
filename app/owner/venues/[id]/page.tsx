"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import OwnerListingEditor from "@/components/venue/OwnerListingEditor";
import OwnerModerationPanel from "@/components/venue/OwnerModerationPanel";
import { ApiError } from "@/lib/api/client";
import { apiErrorMessage } from "@/lib/api/error-message";
import { createAvailabilityOverride, deleteAvailabilityOverride, getVenue, getVenueAvailabilitySettings, replaceWeeklyAvailability, updateVenueTimezone } from "@/lib/api/venues";
import { formatDate } from "@/lib/format";
import type { AvailabilityOverrideType, DayOfWeek, Venue, VenueAvailabilitySettings, WeeklyIntervalRequest } from "@/types/venue";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "MONDAY", label: "Monday" }, { key: "TUESDAY", label: "Tuesday" }, { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" }, { key: "FRIDAY", label: "Friday" }, { key: "SATURDAY", label: "Saturday" }, { key: "SUNDAY", label: "Sunday" },
];

export default function OwnerVenuePage({ params }: { params: { id: string } }) {
  return <DashboardShell eyebrow="Owner listing" title="Listing settings" intro="Manage venue details, timezone, weekly hours and date-specific exceptions."><RoleGuard role="OWNER"><OwnerVenue venueId={params.id} /></RoleGuard></DashboardShell>;
}

function OwnerVenue({ venueId }: { venueId: string }) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [settings, setSettings] = useState<VenueAvailabilitySettings | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "not-found" | "error">("loading");
  const [error, setError] = useState("");
  const [moderationRefresh, setModerationRefresh] = useState(0);
  const [reviewNotice, setReviewNotice] = useState("");

  const load = useCallback(async () => {
    if (!UUID_PATTERN.test(venueId)) { setState("not-found"); return; }
    setState("loading");
    try {
      const [loadedVenue, loadedSettings] = await Promise.all([getVenue(venueId, "required"), getVenueAvailabilitySettings(venueId)]);
      setVenue(loadedVenue); setSettings(loadedSettings); setState("ready");
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 403) setState("forbidden");
      else if (reason instanceof ApiError && reason.status === 404) setState("not-found");
      else { setError(apiErrorMessage(reason, "OWNER")); setState("error"); }
    }
  }, [venueId]);
  useEffect(() => { void load(); }, [load]);

  if (state === "loading") return <LoadingState label="Loading listing settings…" />;
  if (state === "forbidden") return <ErrorState title="Listing not available" message="You do not have permission to manage this venue." />;
  if (state === "not-found") return <ErrorState title="Listing not found" message="This listing reference is invalid or the venue no longer exists." />;
  if (state === "error") return <ErrorState message={error} onRetry={() => void load()} />;
  if (!venue || !settings) return null;
  function venueChanged(updated: Venue) {
    if (venue?.status === "ACTIVE" && updated.status === "PENDING") setReviewNotice("Your changes were saved. Because production-critical information changed, Eema will review the listing again.");
    else setReviewNotice("");
    setVenue(updated); setModerationRefresh((value) => value + 1);
  }
  return <div className="grid gap-8">
    <div><Link href="/owner/venues" className="btn">Back to My venues</Link></div>
    {reviewNotice&&<p className="border-l-2 border-ochre bg-paper p-4 text-sm" role="status">{reviewNotice}</p>}
    <OwnerModerationPanel venue={venue} refreshKey={moderationRefresh} onSubmitted={load}/>
    <OwnerListingEditor venue={venue} timezone={settings.timezone} onVenueChanged={venueChanged} />
    <TimezoneEditor venueId={venueId} settings={settings} onSaved={setSettings} />
    <WeeklyEditor venueId={venueId} settings={settings} onSaved={setSettings} />
    <OverridesEditor venueId={venueId} settings={settings} onChanged={setSettings} />
  </div>;
}

function TimezoneEditor({ venueId, settings, onSaved }: { venueId: string; settings: VenueAvailabilitySettings; onSaved: (value: VenueAvailabilitySettings) => void }) {
  const [timezone, setTimezone] = useState(settings.timezone);
  const save = useSaveState();
  async function submit(event: FormEvent) { event.preventDefault(); await save.run(async () => onSaved(await updateVenueTimezone(venueId, timezone.trim()))); }
  return <section className="border border-rule bg-paper p-6 md:p-8"><div className="label label-ochre">Listing timezone</div><h2 className="mt-2 font-display text-3xl">Timezone</h2><p className="mt-2 text-sm text-ink/70">Availability is stored and displayed in this IANA timezone. It is not taken from your browser.</p><form onSubmit={(e) => void submit(e)} className="mt-5 flex flex-wrap items-end gap-3"><label className="label label-ink flex-1">IANA timezone<input className="form-input" value={timezone} onChange={(e) => setTimezone(e.target.value)} required placeholder="Europe/Amsterdam" /></label><button className="btn btn-ochre" disabled={save.busy}>{save.busy ? "Saving…" : "Save timezone"}</button></form><SaveNotice save={save} /></section>;
}

function WeeklyEditor({ venueId, settings, onSaved }: { venueId: string; settings: VenueAvailabilitySettings; onSaved: (value: VenueAvailabilitySettings) => void }) {
  const [intervals, setIntervals] = useState<WeeklyIntervalRequest[]>(settings.weekly.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime: shortTime(startTime), endTime: shortTime(endTime) })));
  const save = useSaveState();
  function add(dayOfWeek: DayOfWeek) { setIntervals((values) => [...values, { dayOfWeek, startTime: "08:00", endTime: "20:00" }]); }
  function remove(index: number) { setIntervals((values) => values.filter((_, candidate) => candidate !== index)); }
  function change(index: number, field: "startTime" | "endTime", value: string) { setIntervals((values) => values.map((interval, candidate) => candidate === index ? { ...interval, [field]: value } : interval)); }
  async function submit() {
    if (intervals.some((interval) => !interval.startTime || !interval.endTime || interval.startTime >= interval.endTime)) { save.fail("Each range must have an end time after its start time."); return; }
    await save.run(async () => onSaved(await replaceWeeklyAvailability(venueId, intervals)));
  }
  return <section className="border border-rule bg-paper p-6 md:p-8"><div className="label label-ochre">Regular availability</div><h2 className="mt-2 font-display text-3xl">Weekly hours</h2><p className="mt-2 text-sm text-ink/70">Times use {settings.timezone}. Multiple ranges are supported; the server validates overlaps.</p><div className="mt-6 grid gap-4">{DAYS.map((day) => { const rows = intervals.map((interval, index) => ({ interval, index })).filter(({ interval }) => interval.dayOfWeek === day.key); return <div key={day.key} className="grid gap-3 border-t border-rule pt-4 md:grid-cols-[9rem_1fr_auto]"><div className="label label-ink pt-3">{day.label}</div><div className="grid gap-2">{rows.length === 0 && <span className="pt-2 text-sm italic text-taupe">Unavailable</span>}{rows.map(({ interval, index }) => <div key={index} className="flex flex-wrap items-center gap-2"><input aria-label={`${day.label} start`} type="time" className="form-input mt-0 w-auto" value={interval.startTime} onChange={(e) => change(index, "startTime", e.target.value)} /><span>—</span><input aria-label={`${day.label} end`} type="time" className="form-input mt-0 w-auto" value={interval.endTime} onChange={(e) => change(index, "endTime", e.target.value)} /><button type="button" className="label hover:text-ink" onClick={() => remove(index)}>Remove</button></div>)}</div><button type="button" className="btn self-start" onClick={() => add(day.key)}>Add range</button></div>; })}</div><button type="button" className="btn btn-ochre mt-7" disabled={save.busy} onClick={() => void submit()}>{save.busy ? "Saving…" : "Save weekly hours"}</button><SaveNotice save={save} /></section>;
}

function OverridesEditor({ venueId, settings, onChanged }: { venueId: string; settings: VenueAvailabilitySettings; onChanged: (value: VenueAvailabilitySettings) => void }) {
  const [date, setDate] = useState(""); const [type, setType] = useState<AvailabilityOverrideType>("BLOCKED"); const [allDay, setAllDay] = useState(true); const [startTime, setStartTime] = useState("08:00"); const [endTime, setEndTime] = useState("20:00"); const save = useSaveState();
  async function add(event: FormEvent) { event.preventDefault(); if (!allDay && startTime >= endTime) { save.fail("End time must be after start time."); return; } await save.run(async () => { const created = await createAvailabilityOverride(venueId, { date, type, allDay, startTime: allDay ? null : startTime, endTime: allDay ? null : endTime }); onChanged({ ...settings, overrides: [...settings.overrides, created].sort((a, b) => a.date.localeCompare(b.date)) }); setDate(""); }); }
  async function remove(id: string) { await save.run(async () => { await deleteAvailabilityOverride(venueId, id); onChanged({ ...settings, overrides: settings.overrides.filter((item) => item.id !== id) }); }); }
  return <section className="border border-rule bg-paper p-6 md:p-8"><div className="label label-ochre">Exceptions</div><h2 className="mt-2 font-display text-3xl">Date overrides</h2><p className="mt-2 text-sm text-ink/70">Block time or add special availability in {settings.timezone}.</p><form onSubmit={(e) => void add(e)} className="mt-6 grid gap-4 md:grid-cols-2"><label className="label label-ink">Date<input className="form-input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="label label-ink">Override type<select className="form-input" value={type} onChange={(e) => setType(e.target.value as AvailabilityOverrideType)}><option value="BLOCKED">Block availability</option><option value="AVAILABLE">Add special availability</option></select></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> All day</label>{!allDay && <div className="flex items-end gap-2"><label className="label label-ink">Start<input className="form-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></label><span className="pb-3">—</span><label className="label label-ink">End<input className="form-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></label></div>}<div><button className="btn btn-ochre" disabled={save.busy}>{save.busy ? "Saving…" : "Add override"}</button></div></form><SaveNotice save={save} /><div className="mt-7 border-t border-rule"><div className="label mt-5">Existing overrides</div>{settings.overrides.length === 0 ? <p className="mt-3 text-sm italic text-taupe">No date overrides.</p> : <div className="mt-3 grid gap-3">{settings.overrides.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 border border-rule p-4"><div><div className="text-sm text-ink">{item.type === "BLOCKED" ? "Blocked" : "Special availability"} · {formatDate(item.date)}</div><div className="mt-1 font-mono text-xs text-taupe">{item.allDay ? "All day" : `${shortTime(item.startTime)}–${shortTime(item.endTime)}`} · {settings.timezone}</div></div><button type="button" className="btn" disabled={save.busy} onClick={() => void remove(item.id)}>Delete</button></div>)}</div>}</div></section>;
}

function useSaveState() { const [busy, setBusy] = useState(false); const [success, setSuccess] = useState(false); const [error, setError] = useState(""); return { busy, success, error, fail: (message: string) => { setSuccess(false); setError(message); }, run: async (operation: () => Promise<void>) => { setBusy(true); setSuccess(false); setError(""); try { await operation(); setSuccess(true); } catch (reason) { setError(apiErrorMessage(reason, "OWNER")); } finally { setBusy(false); } } }; }
function SaveNotice({ save }: { save: ReturnType<typeof useSaveState> }) { return <>{save.success && <p className="mt-4 text-sm text-ochreDeep" role="status">Saved successfully.</p>}{save.error && <p className="mt-4 text-sm text-ochreDeep" role="alert">{save.error}</p>}</>; }
function shortTime(value: string | null) { return value ? value.slice(0, 5) : ""; }
