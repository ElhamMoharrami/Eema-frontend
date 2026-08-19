"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import { apiErrorMessage } from "@/lib/api/error-message";
import { createVenue } from "@/lib/api/venues";

export default function NewVenuePage() {
  return <DashboardShell eyebrow="Owner dashboard" title="Add listing" intro="Create a venue record. Availability can be configured after creation."><RoleGuard role="OWNER"><CreateVenueForm /></RoleGuard></DashboardShell>;
}

function CreateVenueForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [sizeM2, setSizeM2] = useState("");
  const [dayRateEur, setDayRateEur] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [clipUrl, setClipUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsedTags = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    if (parsedTags.length > 20) { setError("Use no more than 20 tags."); return; }
    setBusy(true);
    setError("");
    try {
      const venue = await createVenue({
        name: name.trim(), neighbourhood: neighbourhood.trim(), sizeM2: Number(sizeM2),
        dayRateEur: Number(dayRateEur), tags: parsedTags,
        description: description.trim() || undefined, clipUrl: clipUrl.trim() || undefined,
      });
      router.push(`/owner/venues/${venue.id}?created=1`);
    } catch (reason) {
      setError(apiErrorMessage(reason));
      setBusy(false);
    }
  }

  return <form onSubmit={(event) => void submit(event)} className="border border-rule bg-paper p-6 md:p-9">
    <div className="grid gap-6 md:grid-cols-2">
      <Field label="Venue name"><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={120} required /></Field>
      <Field label="Neighbourhood"><input className="form-input" value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)} maxLength={100} required /></Field>
      <Field label="Size (m²)"><input className="form-input" type="number" value={sizeM2} onChange={(e) => setSizeM2(e.target.value)} min={1} max={9999} step={1} required /></Field>
      <Field label="Day rate (EUR)"><input className="form-input" type="number" value={dayRateEur} onChange={(e) => setDayRateEur(e.target.value)} min="0.01" max="99999999.99" step="0.01" required /></Field>
      <Field label="Tags" hint="Comma-separated, up to 20"><input className="form-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="daylight, kitchen, industrial" /></Field>
      <Field label="Video clip URL" hint="Optional, up to 500 characters"><input className="form-input" type="url" value={clipUrl} onChange={(e) => setClipUrl(e.target.value)} maxLength={500} /></Field>
    </div>
    <div className="mt-6"><Field label="Description" hint="Optional, up to 5,000 characters"><textarea className="form-input min-h-36 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} /></Field></div>
    {error && <p className="mt-5 text-sm text-ochreDeep">{error}</p>}
    <div className="mt-8 flex flex-wrap gap-3"><button className="btn btn-ochre" disabled={busy}>{busy ? "Creating…" : "Create listing"}</button><Link href="/owner/venues" className="btn">Cancel</Link></div>
  </form>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="label label-ink">{label}{hint && <span className="ml-2 normal-case tracking-normal text-taupe">{hint}</span>}{children}</label>;
}
