"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import VenuePhoto from "@/components/venue/VenuePhoto";
import { apiErrorMessage } from "@/lib/api/error-message";
import { updateVenue, uploadAndAttachVenuePhoto } from "@/lib/api/venues";
import { backendMediaUrl } from "@/lib/venue-media";
import type { UpdateVenueRequest, Venue } from "@/types/venue";

export default function OwnerListingEditor({ venue, timezone, onVenueChanged }: { venue: Venue; timezone: string; onVenueChanged: (venue: Venue) => void }) {
  return <div className="grid gap-8"><MetadataEditor venue={venue} timezone={timezone} onVenueChanged={onVenueChanged} /><PhotoManager venue={venue} timezone={timezone} onVenueChanged={onVenueChanged} /></div>;
}

function MetadataEditor({ venue, timezone, onVenueChanged }: { venue: Venue; timezone: string; onVenueChanged: (venue: Venue) => void }) {
  const [name, setName] = useState(venue.name);
  const [neighbourhood, setNeighbourhood] = useState(venue.neighbourhood);
  const [sizeM2, setSizeM2] = useState(String(venue.sizeM2));
  const [dayRateEur, setDayRateEur] = useState(String(venue.dayRateEur));
  const [tags, setTags] = useState(venue.tags.join(", "));
  const [description, setDescription] = useState(venue.description ?? "");
  const [clipUrl, setClipUrl] = useState(venue.clipUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(venue.name); setNeighbourhood(venue.neighbourhood); setSizeM2(String(venue.sizeM2));
    setDayRateEur(String(venue.dayRateEur)); setTags(venue.tags.join(", "));
    setDescription(venue.description ?? ""); setClipUrl(venue.clipUrl ?? "");
  }, [venue]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const parsedTags = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    if (parsedTags.length > 20) { setError("Use no more than 20 tags."); return; }
    if (new Set(parsedTags).size !== parsedTags.length) { setError("Remove duplicate tags before saving."); return; }
    setBusy(true); setSuccess(false); setError("");
    try {
      const updated = await updateVenue(venue.id, {
        name: name.trim(), neighbourhood: neighbourhood.trim(), sizeM2: Number(sizeM2), dayRateEur: Number(dayRateEur),
        tags: parsedTags, description: description.trim() || null, clipUrl: clipUrl.trim() || null,
        timezone, photoPaths: venue.photoPaths,
      });
      onVenueChanged(updated); setSuccess(true);
    } catch (reason) { setError(apiErrorMessage(reason)); } finally { setBusy(false); }
  }

  return <section className="border border-rule bg-paper p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="label label-ochre">Listing information</div><h2 className="mt-2 font-display text-3xl">Edit details</h2></div><StatusBadge kind="venue" status={venue.status} /></div><p className="mt-3 text-sm text-ink/70">Status and ownership are controlled by Eema and are not changed here.</p><form onSubmit={(event) => void submit(event)} className="mt-6"><div className="grid gap-5 md:grid-cols-2"><Field label="Venue name"><input className="form-input" required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label="Neighbourhood"><input className="form-input" required maxLength={100} value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)} /></Field><Field label="Size (m²)"><input className="form-input" type="number" required min={1} max={9999} step={1} value={sizeM2} onChange={(e) => setSizeM2(e.target.value)} /></Field><Field label="Day rate (EUR)"><input className="form-input" type="number" required min="0.01" max="99999999.99" step="0.01" value={dayRateEur} onChange={(e) => setDayRateEur(e.target.value)} /></Field><Field label="Tags" hint="Comma-separated, up to 20"><input className="form-input" value={tags} onChange={(e) => setTags(e.target.value)} /></Field><Field label="Video clip URL" hint="Optional"><input className="form-input" type="url" maxLength={500} value={clipUrl} onChange={(e) => setClipUrl(e.target.value)} /></Field></div><div className="mt-5"><Field label="Description" hint="Optional"><textarea className="form-input min-h-32 resize-y" maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} /></Field></div><button className="btn btn-ochre mt-6" disabled={busy}>{busy ? "Saving…" : "Save listing details"}</button>{success && <p className="mt-4 text-sm text-ochreDeep" role="status">Listing details saved.</p>}{error && <p className="mt-4 text-sm text-ochreDeep" role="alert">{error}</p>}</form></section>;
}

function PhotoManager({ venue, timezone, onVenueChanged }: { venue: Venue; timezone: string; onVenueChanged: (venue: Venue) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "update" | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file || busy) return;
    setBusy("upload"); setSuccess(""); setError("");
    try {
      const updated = await uploadAndAttachVenuePhoto(venue.id, file);
      onVenueChanged(updated); setSuccess("Photo uploaded and attached to the listing.");
      if (inputRef.current) inputRef.current.value = "";
    } catch (reason) {
      setError(`${apiErrorMessage(reason)} The photo was not added to this listing.`);
      if (inputRef.current) inputRef.current.value = "";
    } finally { setBusy(null); }
  }

  async function persistPhotos(photoPaths: string[], message: string) {
    if (busy) return;
    setBusy("update"); setSuccess(""); setError("");
    try {
      const updated = await updateVenue(venue.id, venueRequest(venue, timezone, photoPaths));
      onVenueChanged(updated); setSuccess(message);
    } catch (reason) { setError(`${apiErrorMessage(reason)} The displayed photo order was not changed.`); } finally { setBusy(null); }
  }

  function move(index: number, offset: number) {
    const destination = index + offset;
    if (destination < 0 || destination >= venue.photoPaths.length) return;
    const next = [...venue.photoPaths];
    [next[index], next[destination]] = [next[destination], next[index]];
    void persistPhotos(next, destination === 0 ? "Primary photo updated." : "Photo order saved.");
  }

  return <section className="border border-rule bg-paper p-6 md:p-8"><div className="label label-ochre">Listing media</div><h2 className="mt-2 font-display text-3xl">Photos</h2><p className="mt-3 text-sm text-ink/70">Up to 12 JPEG, PNG, or WebP images. The first photo is the primary marketplace image.</p><div className="mt-6"><label className="label label-ink">Add photo<input ref={inputRef} className="form-input" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy !== null || venue.photoPaths.length >= 12} onChange={(event) => void upload(event.target.files?.[0])} /></label>{busy === "upload" && <p className="mt-3 text-sm italic text-taupe">Uploading and attaching photo…</p>}</div>{venue.photoPaths.length === 0 ? <p className="mt-7 border-t border-rule pt-5 text-sm italic text-taupe">No listing photos yet.</p> : <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{venue.photoPaths.map((path, index) => <div key={path} className="border border-rule p-3"><div className="relative overflow-hidden bg-paperDeep" style={{ aspectRatio: "4 / 3" }}><VenuePhoto src={backendMediaUrl(path)} alt={`${venue.name} photo ${index + 1}`} /></div><div className="mt-3 flex items-center justify-between gap-3"><span className={index === 0 ? "label label-ochre" : "label"}>{index === 0 ? "Primary photo" : `Photo ${index + 1}`}</span><span className="font-mono text-xs text-taupe">{index + 1}/{venue.photoPaths.length}</span></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="btn px-3 py-2" disabled={busy !== null || index === 0} onClick={() => move(index, -1)}>Move up</button><button type="button" className="btn px-3 py-2" disabled={busy !== null || index === venue.photoPaths.length - 1} onClick={() => move(index, 1)}>Move down</button><button type="button" className="btn px-3 py-2" disabled={busy !== null} onClick={() => void persistPhotos(venue.photoPaths.filter((value) => value !== path), "Photo removed from the listing.")}>Remove</button></div></div>)}</div>}{busy === "update" && <p className="mt-4 text-sm italic text-taupe">Saving photo changes…</p>}{success && <p className="mt-4 text-sm text-ochreDeep" role="status">{success}</p>}{error && <p className="mt-4 text-sm text-ochreDeep" role="alert">{error}</p>}</section>;
}

function venueRequest(venue: Venue, timezone: string, photoPaths: string[]): UpdateVenueRequest {
  return { name: venue.name, neighbourhood: venue.neighbourhood, sizeM2: venue.sizeM2, dayRateEur: venue.dayRateEur, tags: venue.tags, description: venue.description, clipUrl: venue.clipUrl, timezone, photoPaths };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="label label-ink">{label}{hint && <span className="ml-2 normal-case tracking-normal text-taupe">{hint}</span>}{children}</label>;
}
