"use client";

import { useState } from "react";
import { createCheckout } from "@/lib/api/checkout";
import { apiErrorMessage } from "@/lib/api/error-message";
import { saveBookingNavigation } from "@/lib/auth/booking-navigation";
import { formatEur } from "@/lib/format";
import type { User } from "@/types/auth";
import type { MatchedVenue } from "@/types/match";
import BookerVerification from "./BookerVerification";

type Props = {
  match: MatchedVenue;
  brief: string;
  user: User;
};

export default function InstantQuote({ match, brief, user }: Props) {
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBooker, setShowBooker] = useState(false);
  const [shootDate, setShootDate] = useState("");
  const [name, setName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");

  const venue = match.venue;
  const totalLabel = formatEur(venue.dayRateEur);

  const reserve = async () => {
    if (reserving) return;
    setError(null);
    setReserving(true);
    try {
      const checkout = await createCheckout({
        venueId: venue.id,
        shootDate,
        rawBrief: brief,
        scoutContact: {
          name: name.trim(),
          email: email.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
      });
      saveBookingNavigation(checkout.bookingId);
      window.location.assign(checkout.checkoutUrl);
    } catch (e) {
      setError(apiErrorMessage(e));
      setReserving(false);
    }
  };

  return (
    <aside className="settle-slow border border-rule bg-paper p-7 md:p-9">
      <div className="flex items-center justify-between">
        <div className="label label-ink">Instant Quote</div>
        <span className="label">Spring-backed checkout</span>
      </div>

      <h3 className="mt-4 font-display text-3xl leading-tight">{venue.name}</h3>
      <p className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-ink/80">
        {match.explanation}
      </p>

      <span className="rule my-7" aria-hidden />

      <ul className="space-y-3">
        {match.quoteItems.map((li, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between gap-6 border-b border-dotted border-rule pb-2"
          >
            <span className="text-[0.98rem] text-ink">{li.label}</span>
            <span className="tabular font-mono text-[0.98rem] text-ink">{formatEur(li.amount)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-baseline justify-between">
        <span className="label label-ochre">Listed venue price</span>
        <span className="tabular font-mono text-2xl text-ink">
          {totalLabel}
        </span>
      </div>

      <span className="rule my-6" aria-hidden />

      <p className="text-xs leading-relaxed text-taupe">
        Eema confirms the authoritative checkout amount with Spring before Mollie opens.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="label label-ink">
          Shoot date
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={shootDate}
            onChange={(event) => setShootDate(event.target.value)}
            className="mt-2 block w-full border-b border-ink/60 bg-transparent py-2 font-sans text-sm normal-case tracking-normal"
          />
        </label>
        <label className="label label-ink">
          Contact name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 block w-full border-b border-ink/60 bg-transparent py-2 font-sans text-sm normal-case tracking-normal" />
        </label>
        <label className="label label-ink">
          Contact email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full border-b border-ink/60 bg-transparent py-2 font-sans text-sm normal-case tracking-normal" />
        </label>
        <label className="label label-ink">
          Phone · optional
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 block w-full border-b border-ink/60 bg-transparent py-2 font-sans text-sm normal-case tracking-normal" />
        </label>
      </div>

      {showBooker ? (
        <BookerVerification
          totalLabel={totalLabel}
          paying={reserving}
          onConfirm={() => {
            reserve();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowBooker(true)}
          disabled={!shootDate || name.trim().length < 2 || !email.trim()}
          className="btn btn-ochre mt-6 w-full"
        >
          {`Continue — pay ${totalLabel}`}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-ochreDeep">{error}</p>}
    </aside>
  );
}
