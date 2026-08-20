"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types/auth";
import type { MatchedVenue } from "@/types/match";
import { venuePhoto } from "@/lib/venue-media";
import GalleryFrame from "./GalleryFrame";
import InstantQuote from "@/components/checkout/InstantQuote";
import VenuePricingSummary from "./VenuePricingSummary";
import VenueProductionProfile from "./VenueProductionProfile";
import { getVenue } from "@/lib/api/venues";
import type { Venue } from "@/types/venue";

type Props = {
  match: MatchedVenue;
  brief: string;
  user: User;
  onBack: () => void;
};
export default function VenueDetail({ match, brief, user, onBack }: Props) {
  const venue = match.venue;
  const [venueDetails, setVenueDetails] = useState<Venue | null>(null);

  useEffect(() => {
    let active = true;
    void getVenue(venue.id).then((details) => { if (active) setVenueDetails(details); }).catch(() => { if (active) setVenueDetails(null); });
    return () => { active = false; };
  }, [venue.id]);

  return (
    <section className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
      <div>
        <button onClick={onBack} className="label mb-6 inline-flex items-center gap-2 hover:text-ink">
          ← Back to selection
        </button>
        <GalleryFrame
          photoUrl={venuePhoto(venue)}
          caption={`${venue.name} · ${venue.sizeM2} m² · ${venue.neighbourhood}`}
          large
        />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="border-t border-rule pt-3"><div className="label">Pricing</div><div className="mt-1"><VenuePricingSummary {...venue} /></div></div>
          <Stat label="Size" value={`${venue.sizeM2} m²`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
          {venue.tags.map((t) => (
            <span key={t} className="label">· {t}</span>
          ))}
        </div>
        {venueDetails && <VenueProductionProfile venue={venueDetails} />}
      </div>

      <div>
        {user.role === "SCOUT" ? <InstantQuote match={match} brief={brief} user={user} /> : <div className="border border-rule bg-paper p-7 md:p-9"><div className="label label-ink">Scout booking requests</div><h3 className="mt-4 font-display text-3xl">This venue is available to browse.</h3><p className="mt-3 text-sm leading-relaxed text-taupe">Booking requests are available to scout accounts. Owner accounts can review their venues and incoming requests from the owner dashboard.</p></div>}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-rule pt-3">
      <div className="label">{label}</div>
      <div className="tabular font-mono text-base text-ink mt-1">{value}</div>
    </div>
  );
}
