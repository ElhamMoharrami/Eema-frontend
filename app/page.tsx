"use client";

import { useEffect, useState } from "react";
import AuthPanel from "@/components/auth/AuthPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import AppHeader from "@/components/layout/AppHeader";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import ExampleChips from "@/components/matching/ExampleChips";
import SearchBox from "@/components/matching/SearchBox";
import HeroFeature from "@/components/home/HeroFeature";
import VenueCard from "@/components/venue/VenueCard";
import VenueDetail from "@/components/venue/VenueDetail";
import VenuePhoto from "@/components/venue/VenuePhoto";
import { matchVenues } from "@/lib/api/match";
import { getVenues } from "@/lib/api/venues";
import { apiErrorMessage } from "@/lib/api/error-message";
import { venuePhoto } from "@/lib/venue-media";
import VenuePricingSummary from "@/components/venue/VenuePricingSummary";
import type { MatchedVenue, MatchResponse } from "@/types/match";
import type { VenueList } from "@/types/venue";

type Stage = "idle" | "auth" | "matching" | "matched" | "detail";
const DEFAULT_BRIEF = "Standard one-day creative production at this venue.";

export default function Page() {
  const auth = useAuth();
  const [venues, setVenues] = useState<VenueList[]>([]);
  const [venuesState, setVenuesState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [selected, setSelected] = useState<MatchedVenue | null>(null);
  const [pendingBrief, setPendingBrief] = useState<string | null>(null);

  useEffect(() => {
    void loadVenues();
  }, []);

  const loadVenues = async () => {
    setVenuesState("loading");
    try {
      setVenues(await getVenues());
      setVenuesState("ready");
    } catch (reason) {
      setError(apiErrorMessage(reason));
      setVenuesState("error");
    }
  };

  const runMatch = async (brief: string, venueId?: string) => {
    const trimmed = brief.trim();
    if (trimmed.length < 10) {
      setError("Please describe your production in at least 10 characters.");
      return;
    }
    if (!auth.user) {
      setPendingBrief(trimmed);
      setQuery(trimmed);
      setStage("auth");
      return;
    }
    setQuery(trimmed);
    setError(null);
    setStage("matching");
    try {
      const response = await matchVenues({ brief: trimmed, ...(venueId ? { venueId } : {}) });
      setMatch(response);
      if (venueId && response.venues[0]) {
        setSelected(response.venues[0]);
        setStage("detail");
      } else {
        setStage("matched");
      }
    } catch (reason) {
      setError(apiErrorMessage(reason));
      setStage("idle");
    }
  };

  const reset = () => {
    setQuery(""); setMatch(null); setSelected(null); setPendingBrief(null); setError(null); setStage("idle");
  };
  const hero = venues[0];

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pt-10 pb-24 md:px-12">
      <AppHeader onSignIn={() => setStage("auth")} />

      {stage === "detail" && selected && auth.user ? (
        <VenueDetail match={selected} brief={query || DEFAULT_BRIEF} user={auth.user} onBack={() => setStage(match ? "matched" : "idle")} />
      ) : stage === "auth" ? (
        <div className="mx-auto mt-12 max-w-[560px]">
          <AuthPanel onCancel={() => setStage("idle")} onAuthenticated={() => {
            const brief = pendingBrief;
            setPendingBrief(null);
            if (brief) setTimeout(() => void runMatchWithUser(brief), 0);
            else setStage("idle");
          }} />
        </div>
      ) : (
        <>
          <section className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-start">
            <div>
              <h1 className="font-display text-[2.6rem] leading-[1.04] md:text-[3.4rem]">Skip the form.<br />Get a real quote in seconds.</h1>
              <p className="mt-5 max-w-prose text-[1.05rem] leading-relaxed text-ink/80">Describe your shoot or event in plain words. Eema matches it against the live venue catalogue so you can request an available date and time.</p>
              <div className="mt-10"><SearchBox value={query} onChange={setQuery} onSubmit={() => void runMatch(query)} busy={stage === "matching"} /><div className="mt-5"><ExampleChips onPick={(brief) => void runMatch(brief)} /></div></div>
              {error && <p className="mt-6 text-sm text-ochreDeep">{error}</p>}
            </div>
            <div className="md:sticky md:top-10">{venuesState === "loading" ? <LoadingState label="Loading venues…" /> : venuesState === "error" ? <ErrorState message={error ?? "Could not load venues."} onRetry={() => void loadVenues()} /> : hero ? <HeroSummary venue={hero} onOpen={() => void runMatch(query.trim() || DEFAULT_BRIEF, hero.id)} /> : <EmptyState title="No venues available" message="There are no active venues in the catalogue yet." />}</div>
          </section>
          <span className="rule my-16" aria-hidden />
          {stage === "matching" && <p className="font-display text-2xl italic text-ink/70">One moment — Eema is reading your brief…</p>}
          {stage === "matched" && match && (match.venues.length > 0 ? <Results match={match} onOpen={(item) => { setSelected(item); setStage("detail"); }} /> : <EmptyState title="No matching venues" message="Eema couldn't find an active venue matching this brief. Try broadening your request." />)}
          {stage === "idle" && hero && <section><div className="label mb-8">On view today</div><HeroFeature venue={hero} onOpen={() => void runMatch(query.trim() || DEFAULT_BRIEF, hero.id)} /></section>}
        </>
      )}
      <Footer />
    </main>
  );

  async function runMatchWithUser(brief: string) {
    setStage("matching");
    try {
      const response = await matchVenues({ brief });
      setMatch(response);
      setStage("matched");
    } catch (reason) {
      setError(apiErrorMessage(reason));
      setStage("idle");
    }
  }
}

function HeroSummary({ venue, onOpen }: { venue: VenueList; onOpen: () => void }) {
  return <button onClick={onOpen} className="group block w-full text-left"><div className="mat"><div className="relative overflow-hidden bg-paperDeep" style={{ aspectRatio: "4 / 5" }}><VenuePhoto src={venuePhoto(venue)} alt={venue.name} className="transition-transform duration-700 group-hover:scale-[1.02]" /></div></div><div className="mt-3 flex items-start justify-between gap-4"><span className="font-display text-lg">{venue.name}</span><VenuePricingSummary {...venue} compact /></div><div className="label mt-1">{venue.sizeM2} m² · {venue.neighbourhood}</div></button>;
}

function Results({ match, onOpen }: { match: MatchResponse; onOpen: (item: MatchedVenue) => void }) {
  return <div><div className="flex items-baseline justify-between"><div className="label">Selected spaces</div><div className="label">{match.totalMatches} matches · ranked</div></div><div className="mt-6 grid gap-x-8 gap-y-12 md:grid-cols-2 stagger">{match.venues.map((item, index) => <VenueCard key={item.venue.id} venue={item.venue} rationale={item.explanation} index={index} onOpen={() => onOpen(item)} />)}</div></div>;
}

function Footer() { return <footer className="mt-24 flex flex-wrap items-baseline justify-between gap-4 border-t border-rule pt-8"><span className="label">Eema · Europe</span><span className="label">Venue requests backed by authoritative availability</span></footer>; }
