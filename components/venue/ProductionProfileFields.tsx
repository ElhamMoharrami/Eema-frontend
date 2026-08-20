import type { ProductionActivity, Venue, VenueProductionProfile } from "@/types/venue";

export const PRODUCTION_ACTIVITIES: Array<{ value: ProductionActivity; label: string }> = [
  { value: "PHOTO", label: "Photography" },
  { value: "FILM", label: "Film" },
  { value: "VIDEO", label: "Video" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MUSIC_VIDEO", label: "Music video" },
  { value: "CONTENT_CREATION", label: "Content creation" },
];

export type ProductionProfileFormValue = {
  maxCrewSize: string;
  permittedActivities: ProductionActivity[] | null;
  prohibitedActivities: ProductionActivity[] | null;
  naturalLight: boolean | null;
  blackoutPossible: boolean | null;
  ceilingHeightM: string;
  loadingAccess: boolean | null;
  parkingAvailable: boolean | null;
  parkingSpaces: string;
  floorNumber: string;
  liftAvailable: boolean | null;
  wheelchairAccessible: boolean | null;
  bathroomsAvailable: boolean | null;
  soundRecordingSuitable: boolean | null;
  productionRules: string;
  powerDetails: string;
};

export function productionProfileFormValue(venue: Venue): ProductionProfileFormValue {
  return {
    maxCrewSize: nullableNumber(venue.maxCrewSize), permittedActivities: venue.permittedActivities,
    prohibitedActivities: venue.prohibitedActivities, naturalLight: venue.naturalLight,
    blackoutPossible: venue.blackoutPossible, ceilingHeightM: nullableNumber(venue.ceilingHeightM),
    loadingAccess: venue.loadingAccess, parkingAvailable: venue.parkingAvailable,
    parkingSpaces: nullableNumber(venue.parkingSpaces), floorNumber: nullableNumber(venue.floorNumber),
    liftAvailable: venue.liftAvailable, wheelchairAccessible: venue.wheelchairAccessible,
    bathroomsAvailable: venue.bathroomsAvailable, soundRecordingSuitable: venue.soundRecordingSuitable,
    productionRules: venue.productionRules ?? "", powerDetails: venue.powerDetails ?? "",
  };
}

export const EMPTY_PRODUCTION_PROFILE: VenueProductionProfile = {
  maxCrewSize: null, permittedActivities: null, prohibitedActivities: null, naturalLight: null,
  blackoutPossible: null, ceilingHeightM: null, loadingAccess: null, parkingAvailable: null,
  parkingSpaces: null, floorNumber: null, liftAvailable: null, wheelchairAccessible: null,
  bathroomsAvailable: null, soundRecordingSuitable: null, productionRules: null, powerDetails: null,
};

export function productionProfileRequest(value: ProductionProfileFormValue): VenueProductionProfile {
  return {
    maxCrewSize: parseNullableNumber(value.maxCrewSize), permittedActivities: value.permittedActivities,
    prohibitedActivities: value.prohibitedActivities, naturalLight: value.naturalLight,
    blackoutPossible: value.blackoutPossible, ceilingHeightM: parseNullableNumber(value.ceilingHeightM),
    loadingAccess: value.loadingAccess, parkingAvailable: value.parkingAvailable,
    parkingSpaces: value.parkingAvailable === true ? parseNullableNumber(value.parkingSpaces) : null,
    floorNumber: parseNullableNumber(value.floorNumber), liftAvailable: value.liftAvailable,
    wheelchairAccessible: value.wheelchairAccessible, bathroomsAvailable: value.bathroomsAvailable,
    soundRecordingSuitable: value.soundRecordingSuitable,
    productionRules: value.productionRules.trim() || null, powerDetails: value.powerDetails.trim() || null,
  };
}

export function productionProfileError(value: ProductionProfileFormValue): string | null {
  if (value.maxCrewSize && Number(value.maxCrewSize) <= 0) return "Maximum crew size must be greater than zero.";
  if (value.ceilingHeightM && Number(value.ceilingHeightM) <= 0) return "Ceiling height must be greater than zero.";
  if (value.parkingSpaces && Number(value.parkingSpaces) < 0) return "Parking spaces cannot be negative.";
  const overlap = value.permittedActivities?.find((activity) => value.prohibitedActivities?.includes(activity));
  if (overlap) return "An activity cannot be both permitted and prohibited.";
  if (value.parkingAvailable === false && Number(value.parkingSpaces) > 0) return "Positive parking spaces are incompatible with unavailable parking.";
  return null;
}

export default function ProductionProfileFields({ value, onChange }: { value: ProductionProfileFormValue; onChange: (value: ProductionProfileFormValue) => void }) {
  const set = <K extends keyof ProductionProfileFormValue>(key: K, next: ProductionProfileFormValue[K]) => onChange({ ...value, [key]: next });
  return <div className="space-y-8">
    <FormSection title="Production suitability">
      <NumberField label="Maximum crew size" value={value.maxCrewSize} onChange={(next) => set("maxCrewSize", next)} min={1} max={10000} />
      <NumberField label="Ceiling height (m)" value={value.ceilingHeightM} onChange={(next) => set("ceilingHeightM", next)} min={0.01} max={99.99} step={0.01} />
      <TriState label="Natural light" value={value.naturalLight} onChange={(next) => set("naturalLight", next)} />
      <TriState label="Blackout possible" value={value.blackoutPossible} onChange={(next) => set("blackoutPossible", next)} />
      <TriState label="Sound recording suitable" value={value.soundRecordingSuitable} onChange={(next) => set("soundRecordingSuitable", next)} />
      <ActivityPicker label="Permitted production activities" value={value.permittedActivities} blocked={value.prohibitedActivities ?? []} onChange={(next) => set("permittedActivities", next)} />
      <ActivityPicker label="Prohibited production activities" value={value.prohibitedActivities} blocked={value.permittedActivities ?? []} onChange={(next) => set("prohibitedActivities", next)} />
    </FormSection>

    <FormSection title="Access & logistics">
      <TriState label="Loading access" value={value.loadingAccess} onChange={(next) => set("loadingAccess", next)} />
      <TriState label="Parking available" value={value.parkingAvailable} onChange={(next) => onChange({ ...value, parkingAvailable: next, parkingSpaces: next === true ? value.parkingSpaces : "" })} />
      {value.parkingAvailable === true && <NumberField label="Parking spaces" value={value.parkingSpaces} onChange={(next) => set("parkingSpaces", next)} min={0} max={10000} />}
      <NumberField label="Floor number" hint="Negative numbers are allowed for basement levels" value={value.floorNumber} onChange={(next) => set("floorNumber", next)} min={-20} max={200} />
      <TriState label="Lift available" value={value.liftAvailable} onChange={(next) => set("liftAvailable", next)} />
      <TriState label="Wheelchair accessible" value={value.wheelchairAccessible} onChange={(next) => set("wheelchairAccessible", next)} />
    </FormSection>

    <FormSection title="Facilities & technical">
      <TriState label="Bathrooms available" value={value.bathroomsAvailable} onChange={(next) => set("bathroomsAvailable", next)} />
      <TextArea label="Power details" hint="Describe the available electrical setup" value={value.powerDetails} onChange={(next) => set("powerDetails", next)} maxLength={2000} />
    </FormSection>

    <FormSection title="Production rules" columns={1}>
      <TextArea label="Rules and considerations" hint="Access restrictions, noise considerations, cleanup expectations, or equipment limitations" value={value.productionRules} onChange={(next) => set("productionRules", next)} maxLength={5000} />
    </FormSection>
  </div>;
}

function FormSection({ title, columns = 2, children }: { title: string; columns?: 1 | 2; children: React.ReactNode }) {
  return <fieldset className="border-t border-rule pt-5"><legend className="font-display text-2xl">{title}</legend><div className={`mt-5 grid gap-5 ${columns === 2 ? "md:grid-cols-2" : ""}`}>{children}</div></fieldset>;
}

function TriState({ label, value, onChange }: { label: string; value: boolean | null; onChange: (value: boolean | null) => void }) {
  return <label className="label label-ink">{label}<select className="form-input" value={value === null ? "" : String(value)} onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "true")}><option value="">Not specified</option><option value="true">Yes</option><option value="false">No</option></select></label>;
}

function ActivityPicker({ label, value, blocked, onChange }: { label: string; value: ProductionActivity[] | null; blocked: ProductionActivity[]; onChange: (value: ProductionActivity[] | null) => void }) {
  function toggle(activity: ProductionActivity) {
    const selected = value ?? [];
    onChange(selected.includes(activity) ? selected.filter((item) => item !== activity) : [...selected, activity]);
  }
  return <fieldset><legend className="label label-ink">{label}</legend><select className="form-input" value={value === null ? "unknown" : "specified"} onChange={(event) => onChange(event.target.value === "unknown" ? null : [])}><option value="unknown">Not specified</option><option value="specified">Specify activities</option></select>{value !== null && <div className="mt-3 grid gap-2 sm:grid-cols-2">{PRODUCTION_ACTIVITIES.map((activity) => <label key={activity.value} className={`flex items-center gap-2 text-sm ${blocked.includes(activity.value) ? "text-taupe/50" : "text-ink"}`}><input type="checkbox" checked={value.includes(activity.value)} disabled={blocked.includes(activity.value)} onChange={() => toggle(activity.value)} />{activity.label}</label>)}</div>}</fieldset>;
}

function NumberField({ label, hint, value, onChange, min, max, step = 1 }: { label: string; hint?: string; value: string; onChange: (value: string) => void; min: number; max: number; step?: number }) {
  return <label className="label label-ink">{label}{hint && <span className="ml-2 normal-case tracking-normal text-taupe">{hint}</span>}<input className="form-input" type="number" value={value} onChange={(event) => onChange(event.target.value)} min={min} max={max} step={step} /></label>;
}

function TextArea({ label, hint, value, onChange, maxLength }: { label: string; hint: string; value: string; onChange: (value: string) => void; maxLength: number }) {
  return <label className="label label-ink">{label}<span className="ml-2 normal-case tracking-normal text-taupe">{hint}</span><textarea className="form-input min-h-28 resize-y" value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} /></label>;
}

function nullableNumber(value: number | null): string { return value === null ? "" : String(value); }
function parseNullableNumber(value: string): number | null { return value.trim() === "" ? null : Number(value); }
