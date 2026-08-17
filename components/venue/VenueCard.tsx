"use client";

import type { VenueList } from "@/types/venue";
import { venuePhoto } from "@/lib/venue-media";
import VenuePhoto from "./VenuePhoto";
import { formatEur } from "@/lib/format";

type Props = {
  venue: VenueList;
  rationale: string;
  featured?: boolean;
  index: number;
  onOpen: () => void;
};

export default function VenueCard({ venue, rationale, featured, index, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "group block w-full text-left",
        featured ? "md:col-span-2" : "",
      ].join(" ")}
    >
      <div className="mat">
        <span className="crop tl" />
        <span className="crop tr" />
        <span className="crop bl" />
        <span className="crop br" />
        <div
          className="relative overflow-hidden bg-paperDeep"
          style={{ aspectRatio: featured ? "16 / 9" : "4 / 3" }}
        >
          <VenuePhoto
            src={venuePhoto(venue)}
            alt={venue.name}
            className="transition-transform duration-700 group-hover:scale-[1.02]"
          />
          {featured && (
            <span className="absolute left-3 top-3 bg-paper/90 px-2 py-1 text-[0.62rem] uppercase tracking-label text-ochre">
              Featured · House selection
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-6">
        <div>
          <div className="label mb-1">
            <span className="tabular" style={{ fontFamily: "var(--font-mono)" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="mx-2">·</span>
            <span>{venue.neighbourhood}</span>
          </div>
          <h3 className={featured ? "font-display text-3xl" : "font-display text-2xl"}>
            {venue.name}
          </h3>
        </div>
        <div className="text-right">
          <div className="label mb-1">Day rate</div>
          <div className="tabular font-mono text-lg text-ink">
            {formatEur(venue.dayRateEur)}
          </div>
        </div>
      </div>

      <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-ink/80">
        {rationale}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        <span className="label">{venue.sizeM2} m²</span>
        {venue.tags.slice(0, 4).map((t) => (
          <span key={t} className="label">· {t.replace(/-/g, " ")}</span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="label-ochre label">View · Get quote</span>
        <span className="rule flex-1 ml-4" aria-hidden />
      </div>
    </button>
  );
}
