import type { User } from "./auth";

export type VenueStatus = "DRAFT" | "PENDING" | "ACTIVE" | "SUSPENDED";

export type VenueList = {
  id: string;
  name: string;
  neighbourhood: string;
  sizeM2: number;
  dayRateEur: number;
  tags: string[];
  firstPhotoUrl: string | null;
  status: VenueStatus;
};

export type Venue = {
  id: string;
  owner: User;
  name: string;
  neighbourhood: string;
  sizeM2: number;
  dayRateEur: number;
  tags: string[];
  photoPaths: string[];
  clipUrl: string | null;
  description: string | null;
  status: VenueStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateVenueRequest = {
  name: string;
  neighbourhood: string;
  sizeM2: number;
  dayRateEur: number;
  tags: string[];
  description?: string;
  clipUrl?: string;
};
