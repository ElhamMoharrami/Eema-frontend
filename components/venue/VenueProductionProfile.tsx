import { PRODUCTION_ACTIVITIES } from "@/components/venue/ProductionProfileFields";
import type { ProductionActivity, Venue } from "@/types/venue";

export default function VenueProductionProfile({ venue }: { venue: Venue }) {
  return <div className="mt-8 space-y-7 border-t border-rule pt-6">
    <ProfileSection title="Suitable for"><p className="text-sm text-ink/80">{activityList(venue.permittedActivities)}</p>{venue.prohibitedActivities !== null && <p className="mt-2 text-xs text-taupe">Not permitted: {activityList(venue.prohibitedActivities)}</p>}</ProfileSection>
    <div className="grid gap-5 sm:grid-cols-2">
      <Fact label="Maximum crew" value={venue.maxCrewSize === null ? "Not specified" : `${venue.maxCrewSize} people`} />
      <Fact label="Ceiling height" value={venue.ceilingHeightM === null ? "Not specified" : `${venue.ceilingHeightM} m`} />
      <Fact label="Natural light" value={yesNo(venue.naturalLight)} />
      <Fact label="Blackout possible" value={yesNo(venue.blackoutPossible)} />
      <Fact label="Sound recording" value={venue.soundRecordingSuitable === null ? "Not specified" : venue.soundRecordingSuitable ? "Suitable" : "Not suitable"} />
      <Fact label="Loading access" value={yesNo(venue.loadingAccess)} />
      <Fact label="Parking" value={parking(venue)} />
      <Fact label="Floor" value={venue.floorNumber === null ? "Not specified" : String(venue.floorNumber)} />
      <Fact label="Lift" value={yesNo(venue.liftAvailable)} />
      <Fact label="Wheelchair accessible" value={yesNo(venue.wheelchairAccessible)} />
      <Fact label="Bathrooms" value={yesNo(venue.bathroomsAvailable)} />
    </div>
    <ProfileSection title="Production rules"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{venue.productionRules || "Not specified"}</p></ProfileSection>
    <ProfileSection title="Power"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{venue.powerDetails || "Not specified"}</p></ProfileSection>
  </div>;
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><div className="label label-ochre">{title}</div><div className="mt-2">{children}</div></section>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="border-t border-rule pt-3"><div className="label">{label}</div><div className="mt-1 text-sm text-ink/80">{value}</div></div>;
}

function yesNo(value: boolean | null): string { return value === null ? "Not specified" : value ? "Yes" : "No"; }

function activityList(values: ProductionActivity[] | null): string {
  if (values === null) return "Not specified";
  if (values.length === 0) return "None selected";
  const labels = new Map(PRODUCTION_ACTIVITIES.map((activity) => [activity.value, activity.label]));
  return values.map((value) => labels.get(value) ?? value).join(" · ");
}

function parking(venue: Venue): string {
  if (venue.parkingAvailable === null) return "Not specified";
  if (!venue.parkingAvailable) return "No";
  return venue.parkingSpaces === null ? "Yes" : `${venue.parkingSpaces} ${venue.parkingSpaces === 1 ? "space" : "spaces"}`;
}
