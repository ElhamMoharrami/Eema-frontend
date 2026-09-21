"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createAvailabilityInquiry } from "@/lib/api/inquiries";
import { apiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "@/components/auth/AuthProvider";
import VerificationRequired from "@/components/auth/VerificationRequired";

export default function AvailabilityInquiryForm({ venueId, timezone, initialDate = "", onCancel }: { venueId: string; timezone: string; initialDate?: string; onCancel: () => void }) {
  const { user } = useAuth();
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (user && !user.emailVerified) return <div className="mt-6"><VerificationRequired /></div>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (startTime >= endTime) { setError("End time must be after start time."); return; }
    setBusy(true); setError("");
    try {
      await createAvailabilityInquiry({ venueId, requestedDate: date, requestedStartTime: startTime, requestedEndTime: endTime, message: message.trim() || "I'd like to ask about this time." });
      setSent(true);
    } catch (reason) { setError(apiErrorMessage(reason)); setBusy(false); }
  }

  if (sent) return <div className="mt-6 border border-rule bg-paperDeep/40 p-5" role="status"><div className="available-mark">Inquiry sent</div><h4 className="mt-3 font-display text-2xl">Waiting for owner</h4><p className="mt-2 text-sm text-ink/75">The owner can decline or offer a one-off time. This is not a booking request.</p><Link href="/scout/inquiries" className="btn mt-5 inline-block">View inquiries</Link></div>;

  return <form onSubmit={(event) => void submit(event)} className="mt-6 border border-rule bg-paperDeep/40 p-5">
    <div className="label label-ochre">This venue isn&apos;t currently available at that time.</div>
    <h4 className="mt-3 font-display text-2xl">Ask owner about this time</h4>
    <p className="mt-2 text-xs text-taupe">Times shown in {timezone}. Repeated times on clock-change dates use the first occurrence. This does not change the venue&apos;s regular availability.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="label label-ink sm:col-span-2">Date<input className="form-input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="label label-ink">Start time<input className="form-input" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label><label className="label label-ink">End time<input className="form-input" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label><label className="label label-ink sm:col-span-2">Message · optional<textarea className="form-input min-h-24 resize-y" maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share any flexibility or context with the owner." /></label></div>
    {error && <p className="mt-4 text-sm text-ochreDeep">{error}</p>}
    <div className="mt-5 flex flex-wrap gap-3"><button className="btn btn-ochre" disabled={busy}>{busy ? "Sending…" : "Ask owner about this time"}</button><button type="button" className="btn" onClick={onCancel} disabled={busy}>Back to available times</button></div>
  </form>;
}
