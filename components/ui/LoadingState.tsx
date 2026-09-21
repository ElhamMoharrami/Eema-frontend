export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div role="status" aria-live="polite" className="settle py-14 text-center"><div className="label">Please wait</div><p className="mt-3 font-display text-2xl italic text-ink/70">{label}</p></div>;
}
