import type { VenueList } from "./venue";

export type MatchRequest = {
  brief: string;
  venueId?: string;
};

export type QuoteItem = {
  label: string;
  amount: number;
  note: string | null;
};

export type MatchedVenue = {
  venue: VenueList;
  score: number;
  explanation: string;
  quoteItems: QuoteItem[];
};

export type MatchResponse = {
  venues: MatchedVenue[];
  brief: string;
  totalMatches: number;
};
