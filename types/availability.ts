export type AvailabilityIntervalDto = {
  startTime: string;
  endTime: string;
};

export type DailyAvailabilityDto = {
  date: string;
  intervals: AvailabilityIntervalDto[];
};

export type VenueAvailabilityDto = {
  venueId: string;
  timezone: string;
  dates: DailyAvailabilityDto[];
};
