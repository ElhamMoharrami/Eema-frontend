// Labels explain Spring readiness keys; no client-side readiness calculation.
export const READINESS_ISSUE_LABELS: Record<string, string> = {
    maxCrewSize: "Crew capacity",
    permittedActivities: "Permitted production activities",
    productionRules: "Production rules",
    naturalLight: "Natural-light information",
    loadingAccess: "Loading-access information",
    bathroomsAvailable: "Bathroom information",
    soundRecordingSuitable: "Sound-recording suitability",
    hourlyRateEur: "Pricing",
    minimumBookingMinutes: "Minimum booking duration",
    minimumLeadTimeMinutes: "Minimum lead time",
    timezone: "Timezone",
    photoPaths: "Listing photos",
  };

export const readinessIssueLabel = (issue: string): string => READINESS_ISSUE_LABELS[issue] ?? issue;
