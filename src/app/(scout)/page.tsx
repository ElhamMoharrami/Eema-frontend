'use client';
import { useState, useEffect, useRef } from 'react';
import { VenueGrid } from '@/components/venue/VenueGrid';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { venueApi, matchApi, ApiError } from '@/lib/api-client';
import { VenueListDto, MatchedVenue } from '@/lib/api-types';
import { cx } from '@/lib/utils';

const EXAMPLE_BRIEFS = [
  'Raw industrial space with high ceilings for a fashion campaign',
  'Quiet residential interior for a beauty campaign, lots of natural light',
  'Large warehouse for a car shoot, need loading dock access',
];

const THINKING_MESSAGES = [
  'Reading your brief…',
  'Scanning Amsterdam venues…',
  'Matching aesthetic and logistics…',
  'Building your shortlist…',
];

type State = 'idle' | 'searching' | 'results' | 'error';

export default function SearchPage() {
  const [brief, setBrief] = useState('');
  const [state, setState] = useState<State>('idle');
  const [allVenues, setAllVenues] = useState<VenueListDto[]>([]);
  const [matchedVenues, setMatchedVenues] = useState<MatchedVenue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thinkingMsg, setThinkingMsg] = useState(THINKING_MESSAGES[0]);
  const thinkingInterval = useRef<NodeJS.Timeout | null>(null);

  // Load all venues on mount for the initial grid
  useEffect(() => {
    venueApi.list().then(setAllVenues).catch(console.error);
  }, []);

  // Cycle thinking messages during search
  useEffect(() => {
    if (state === 'searching') {
      let i = 0;
      thinkingInterval.current = setInterval(() => {
        i = (i + 1) % THINKING_MESSAGES.length;
        setThinkingMsg(THINKING_MESSAGES[i]);
      }, 1800);
    } else {
      if (thinkingInterval.current) clearInterval(thinkingInterval.current);
    }
    return () => { if (thinkingInterval.current) clearInterval(thinkingInterval.current); };
  }, [state]);

  const handleSearch = async () => {
    if (!brief.trim()) return;
    setState('searching');
    setError(null);
    try {
      const res = await matchApi.search({ brief });
      setMatchedVenues(res.venues);
      setState('results');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong.';
      setError(msg);
      setState('error');
    }
  };

  const handleReset = () => {
    setBrief('');
    setMatchedVenues([]);
    setState('idle');
    setError(null);
  };

  const displayVenues: VenueListDto[] = state === 'results'
    ? matchedVenues.map(m => m.venue)
    : allVenues;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Brief input */}
      <div className="mx-auto mb-10 max-w-2xl">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-neutral-900">
          Find your next location
        </h1>
        <p className="mb-6 text-neutral-500">
          Describe your shoot and we'll find the right space in Amsterdam.
        </p>

        <div className="relative">
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
            placeholder="e.g. Raw industrial loft for a menswear editorial, 2 days in August…"
            rows={3}
            className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm
              text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900
              focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
          <Button
            onClick={handleSearch}
            disabled={!brief.trim() || state === 'searching'}
            isLoading={state === 'searching'}
            className="absolute bottom-3 right-3"
            size="sm"
          >
            Find
          </Button>
        </div>

        {/* Example chips */}
        {state === 'idle' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_BRIEFS.map(ex => (
              <button
                key={ex}
                onClick={() => setBrief(ex)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs
                  text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
              >
                {ex.length > 50 ? ex.slice(0, 50) + '…' : ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thinking state */}
      {state === 'searching' && (
        <div className="flex flex-col items-center gap-4 py-20">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-neutral-500 transition-all">{thinkingMsg}</p>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-sm text-neutral-500">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleReset}>Try again</Button>
        </div>
      )}

      {/* Results header */}
      {state === 'results' && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {matchedVenues.length} venue{matchedVenues.length !== 1 ? 's' : ''} matched
          </p>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            New search
          </Button>
        </div>
      )}

      {/* Venue grid */}
      {(state === 'idle' || state === 'results') && displayVenues.length > 0 && (
        <VenueGrid venues={displayVenues} matchedVenues={matchedVenues} />
      )}

      {/* Empty results */}
      {state === 'results' && matchedVenues.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-neutral-500">No venues matched your brief.</p>
          <p className="mt-1 text-sm text-neutral-400">Try different keywords or be less specific.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={handleReset}>
            Start over
          </Button>
        </div>
      )}
    </div>
  );
}