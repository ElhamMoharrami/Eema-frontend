import { VenueCard } from './VenueCard';
import { MatchedVenue, VenueListDto } from '@/lib/api-types';

interface VenueGridProps {
  venues: VenueListDto[];
  matchedVenues?: MatchedVenue[];
}

export function VenueGrid({ venues, matchedVenues }: VenueGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => {
        const match = matchedVenues?.find(m => m.venue.id === venue.id);
        return (
          <VenueCard
            key={venue.id}
            venue={venue}
            explanation={match?.explanation}
            score={match?.score}
          />
        );
      })}
    </div>
  );
}