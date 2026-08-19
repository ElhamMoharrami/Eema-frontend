"use client";

import type { VenueList } from "@/types/venue";
import { venuePhoto } from "@/lib/venue-media";
import GalleryFrame from "@/components/venue/GalleryFrame";
import { formatEur } from "@/lib/format";

type Props = {
  venue: VenueList;
  onOpen: () => void;
};

const prettify = (t: string) => t.replace(/-/g, " ");

export default function HeroFeature({ venue, onOpen }: Props) {
  const headlineTags = venue.tags.slice(0, 3).map(prettify);
  return (
    <section className="grid gap-10 md:grid-cols-[1.2fr_1fr] items-end">
      <GalleryFrame
        photoUrl={venuePhoto(venue)}
        caption={`${venue.name} · ${venue.sizeM2} m² · ${venue.neighbourhood}`}
        large
      />
      <div>
        <div className="label label-ochre">Featured · House selection</div>
        <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.05]">
          {venue.name}.
        </h2>
        <p className="mt-4 text-[0.95rem] uppercase tracking-label text-taupe">
          {headlineTags.join(" · ")}
        </p>
        <p className="mt-5 max-w-prose text-[1.05rem] leading-relaxed text-ink/85">
          {venue.sizeM2} m² in {venue.neighbourhood}. Curated for creative productions and
          available to request through Eema.
        </p>
        <div className="mt-6 flex items-baseline gap-8">
          <div>
            <div className="label">Day rate</div>
            <div className="tabular font-mono text-2xl text-ink mt-1">
              {formatEur(venue.dayRateEur)}
            </div>
          </div>
        </div>
        <button onClick={onOpen} className="btn btn-ochre mt-8">
          View availability
        </button>
      </div>
    </section>
  );
}
