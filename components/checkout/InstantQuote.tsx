"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getVenueAvailability } from "@/lib/api/availability";
import { createBooking } from "@/lib/api/bookings";
import { apiErrorMessage } from "@/lib/api/error-message";
import { saveBookingNavigation } from "@/lib/auth/booking-navigation";
import { formatDate, formatDuration, formatEur } from "@/lib/format";
import { calculatePricingPreview } from "@/lib/pricing";
import type { User } from "@/types/auth";
import type { AvailabilityIntervalDto, VenueAvailabilityDto } from "@/types/availability";
import type { MatchedVenue } from "@/types/match";
import AvailabilityInquiryForm from "@/components/inquiry/AvailabilityInquiryForm";
import VerificationRequired from "@/components/auth/VerificationRequired";
import Link from "next/link";
import { usePolicyStatus } from "@/components/policy/PolicyStatusProvider";
import { ApiError } from "@/lib/api/client";

import { todayInZone, isoDate, monthStart, monthEnd, offsetMonth, type CalendarMonth } from "@/lib/availability-calendar";

type Props = { match: MatchedVenue; brief: string; user: User };
type Month = CalendarMonth;

export default function InstantQuote({ match, brief, user }: Props) {
  const router = useRouter();
  const { status:policyStatus,refresh:refreshPolicies } = usePolicyStatus();
  const [availability, setAvailability] = useState<VenueAvailabilityDto | null>(null);
  const today = todayInZone(availability?.timezone ?? "UTC");
  const initializedVenue = useRef<string | null>(null);
  const requestVersion = useRef(0);
  const [month, setMonth] = useState<Month>(() => { const [year, value] = today.split("-").map(Number); return { year, month: value - 1 }; });
  const [availabilityState, setAvailabilityState] = useState<"loading" | "ready" | "error">("loading");
  const [availabilityError, setAvailabilityError] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [selectedInterval, setSelectedInterval] = useState<AvailabilityIntervalDto | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [name, setName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPrice, setSubmittedPrice] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [inquiryDate, setInquiryDate] = useState<string | null>(null);
  const venue = match.venue;
  const pricePreview = useMemo(() => calculatePricingPreview(startTime, endTime, venue.hourlyRateEur, venue.minimumBookingMinutes, venue.fullDayRateEur), [endTime, startTime, venue.fullDayRateEur, venue.hourlyRateEur, venue.minimumBookingMinutes]);

  useEffect(() => { void loadAvailability(); }, [month.year, month.month, venue.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAvailability() {
    const version = ++requestVersion.current;
    setAvailabilityState("loading"); setAvailabilityError(""); setShootDate(""); setInquiryDate(null); clearTime();
    const from = monthStart(month); const to = monthEnd(month);
    try {
      const result = await getVenueAvailability(venue.id, from, to);
      if (version !== requestVersion.current) return;
      if (initializedVenue.current !== venue.id) {
        initializedVenue.current = venue.id;
        const [year, value] = todayInZone(result.timezone).split("-").map(Number);
        if (month.year !== year || month.month !== value - 1) {
          setMonth({ year, month: value - 1 });
          return; // Reload the venue-local month before displaying selectable dates.
        }
      }
      setAvailability(result); setAvailabilityState("ready");
    } catch (reason) {
      if (version !== requestVersion.current) return;
      setAvailabilityError(apiErrorMessage(reason)); setAvailabilityState("error");
    }
  }

  const selectedDay = availability?.dates.find((day) => day.date === shootDate);
  const canSubmit = !!shootDate && !!selectedInterval && startTime >= shortTime(selectedInterval.startTime) && endTime <= shortTime(selectedInterval.endTime) && startTime < endTime && name.trim().length >= 2 && !!email.trim();

  function selectDate(date: string) { setInquiryDate(null); setShootDate(date); clearTime(); }
  function selectUnavailableDate(date: string) { setShootDate(""); clearTime(); setInquiryDate(date); }
  function selectInterval(interval: AvailabilityIntervalDto) { setSelectedInterval(interval); setStartTime(shortTime(interval.startTime)); setEndTime(shortTime(interval.endTime)); }
  function clearTime() { setSelectedInterval(null); setStartTime(""); setEndTime(""); }

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true); setError("");
    try {
      const booking = await createBooking({ venueId: venue.id, shootDate, startTime, endTime, rawBrief: brief, scoutContact: { name: name.trim(), email: email.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) } });
      saveBookingNavigation(booking.id); setSubmittedPrice(booking.venuePriceEur); setSubmitted(true);
      window.setTimeout(() => router.push(`/bookings/${booking.id}`), 900);
    } catch (reason) { if(reason instanceof ApiError&&reason.status===403&&/polic/i.test(reason.message)){await refreshPolicies();setError("Eema's policies were updated. Please review the current versions before continuing.")}else { if (reason instanceof ApiError && reason.status === 409) await loadAvailability(); setError(apiErrorMessage(reason)); } setSubmitting(false); }
  }

  if (submitted) return <aside className="settle border border-rule bg-paper p-7 md:p-9" role="status"><div className="available-mark">Request sent</div><h3 className="mt-4 font-display text-3xl">Request sent to owner</h3><p className="mt-3 text-sm leading-relaxed text-ink/75">This request does not reserve the venue yet. Opening your booking details…</p>{submittedPrice !== null && <p className="mt-4 font-mono text-lg">Authoritative booking price: {formatEur(submittedPrice)}</p>}</aside>;

  return <aside className="settle-slow border border-rule bg-paper p-7 md:p-9">
    <div className="label label-ink">Request this venue</div>
    <h3 className="mt-4 font-display text-3xl leading-tight">{venue.name}</h3>
    <p className="mt-2 text-sm leading-relaxed text-ink/75">{match.explanation}</p>
    <div className="mt-6 space-y-1 border-y border-rule py-5"><div className="flex items-baseline justify-between"><span className="label label-ochre">Hourly rate</span><span className="font-mono text-xl">{formatEur(venue.hourlyRateEur)}/hour</span></div><p className="text-xs text-taupe">Minimum {formatDuration(venue.minimumBookingMinutes)}</p>{venue.fullDayRateEur !== null && <p className="text-xs text-taupe">Full day {formatEur(venue.fullDayRateEur)}</p>}</div>

    <div className="mt-7"><div className="flex items-baseline justify-between gap-4"><div className="label label-ink">Select a date</div>{availability?.timezone && <span className="text-xs text-taupe">Times shown in {availability.timezone}</span>}</div>
      {availabilityState === "loading" ? <p className="mt-5 text-sm italic text-taupe">Loading authoritative availability…</p> : availabilityState === "error" ? <div className="mt-5 border border-rule p-4"><p className="text-sm text-ochreDeep">{availabilityError}</p><button type="button" className="btn mt-4" onClick={() => void loadAvailability()}>Try again</button></div> : availability && <Calendar month={month} today={today} availability={availability} selected={shootDate || inquiryDate || ""} onSelect={selectDate} onUnavailable={selectUnavailableDate} onMonth={setMonth} />}
    </div>

    {inquiryDate && availability && (policyStatus&&!policyStatus.allRequiredAccepted?<PolicyReview/>:<AvailabilityInquiryForm venueId={venue.id} timezone={availability.timezone} initialDate={inquiryDate} onCancel={() => setInquiryDate(null)} />)}

    {!inquiryDate && selectedDay && <div className="mt-7 border-t border-rule pt-5"><div className="label label-ink">{formatDate(selectedDay.date)}</div><p className="mt-2 text-sm text-taupe">Available intervals</p><div className="mt-3 flex flex-wrap gap-2">{selectedDay.intervals.map((interval) => <button type="button" key={`${interval.startTime}-${interval.endTime}`} onClick={() => selectInterval(interval)} className={selectedInterval === interval ? "chip border-ink" : "chip"}>{shortTime(interval.startTime)}–{shortTime(interval.endTime)}</button>)}</div></div>}

    {!inquiryDate && selectedInterval && <div className="mt-5 grid grid-cols-2 gap-4"><label className="label label-ink">Start time<input type="time" className="form-input" min={shortTime(selectedInterval.startTime)} max={shortTime(selectedInterval.endTime)} value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label><label className="label label-ink">End time<input type="time" className="form-input" min={shortTime(selectedInterval.startTime)} max={shortTime(selectedInterval.endTime)} value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label><p className="col-span-2 text-xs text-taupe">Selection must remain within {shortTime(selectedInterval.startTime)}–{shortTime(selectedInterval.endTime)}.</p></div>}

    {!inquiryDate && pricePreview && <div className="mt-5 border border-rule bg-paperDeep/30 p-4"><div className="label label-ochre">Indicative price</div><div className="mt-3 space-y-1 text-sm text-ink/75"><p>Selected: {formatDuration(pricePreview.durationMinutes)}</p><p>Minimum booking: {formatDuration(venue.minimumBookingMinutes)}</p>{pricePreview.minimumApplies && <p className="font-medium text-ink">{formatDuration(venue.minimumBookingMinutes)} minimum applies</p>}{pricePreview.fullDayRateApplies && <><p>Hourly calculation: {formatEur(pricePreview.hourlyTotal)}</p><p>Full-day rate: {formatEur(venue.fullDayRateEur)}</p></>}<p className="pt-2 font-mono text-lg text-ink">Estimated booking price: {formatEur(pricePreview.estimatedPrice)}</p><p className="pt-1 text-xs text-taupe">Informational estimate. Eema calculates the authoritative price when the request is created.</p></div></div>}

    {!inquiryDate && <><div className="mt-7 grid gap-4 border-t border-rule pt-5"><label className="label label-ink">Contact name<input className="form-input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} /></label><label className="label label-ink">Contact email<input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="label label-ink">Phone · optional<input className="form-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label></div>
    {!user.emailVerified ? <div className="mt-7"><VerificationRequired /></div> : policyStatus&&!policyStatus.allRequiredAccepted?<PolicyReview/>:<button type="button" className="btn btn-ochre mt-7 w-full" disabled={!canSubmit || submitting} onClick={() => void submit()}>{submitting ? "Sending request…" : "Request to book"}</button>}
    <button type="button" className="label label-ochre mt-5 w-full text-center hover:text-ochreDeep" onClick={() => setInquiryDate(today)}>Can&apos;t find your time? Ask the owner</button>
    <p className="mt-3 text-xs leading-relaxed text-taupe">The owner must approve this request before payment. Availability is checked again by Eema when you submit.</p>{error && <p className="mt-3 text-sm text-ochreDeep">{error}</p>}</>}
  </aside>;
}
function PolicyReview(){return <div className="mt-7 border border-ochre bg-amber-50 p-4"><p className="text-sm font-semibold">Updated Eema policies require your review before this marketplace action.</p><Link href="/policies" className="btn mt-4 inline-block">Review updated policies</Link></div>}

function Calendar({ month, today, availability, selected, onSelect, onUnavailable, onMonth }: { month: Month; today: string; availability: VenueAvailabilityDto; selected: string; onSelect: (date: string) => void; onUnavailable: (date: string) => void; onMonth: (month: Month) => void }) {
  const firstWeekday = new Date(Date.UTC(month.year, month.month, 1)).getUTCDay();
  const days = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
  const available = new Set(availability.dates.filter((day) => day.intervals.length > 0).map((day) => day.date));
  const current = (() => { const [y, m] = today.split("-").map(Number); return month.year === y && month.month === m - 1; })();
  return <div className="mt-4"><div className="flex items-center justify-between"><button type="button" className="label hover:text-ink disabled:opacity-30" disabled={current} onClick={() => onMonth(offsetMonth(month, -1))}>← Previous</button><span className="font-display text-lg">{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(month.year, month.month, 1)))}</span><button type="button" className="label hover:text-ink" onClick={() => onMonth(offsetMonth(month, 1))}>Next →</button></div><div className="mt-4 grid grid-cols-7 gap-1 text-center">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="label py-2 text-[0.58rem]">{day}</span>)}{Array.from({ length: firstWeekday }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }, (_, index) => { const date = isoDate(month.year, month.month, index + 1); const future = date >= today; const enabled = future && available.has(date); return <button type="button" key={date} disabled={!future} aria-label={`${formatDate(date)}${enabled ? " available" : " unavailable — ask owner"}`} onClick={() => enabled ? onSelect(date) : onUnavailable(date)} className={`aspect-square border text-sm ${selected === date ? "border-ochre bg-ochre text-paper" : enabled ? "border-rule hover:border-ink" : future ? "border-transparent text-taupe/50 line-through hover:border-ochre" : "border-transparent text-taupe/25 line-through"}`}>{index + 1}</button>; })}</div><div className="mt-3 text-xs text-taupe">Dates crossed out have no backend-provided availability. Select a future date to ask the owner.</div></div>;
}

function shortTime(value: string) { return value.slice(0, 5); }
