"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
};

export default function SearchBox({ value, onChange, onSubmit, busy }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 280) + "px";
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy && value.trim()) onSubmit();
      }}
      className="w-full"
    >
      <div className="border-b border-ink/60 pb-3">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (!busy && value.trim()) onSubmit();
            }
          }}
          rows={2}
          maxLength={1000}
          placeholder="Describe your shoot…"
          className="brief-input"
          aria-label="Describe your shoot"
        />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="label">Press ⌘↵ to search · Eema replies in seconds</span>
        <button type="submit" className="btn" disabled={busy || !value.trim()}>
          {busy ? "Reading…" : "Find venues"}
        </button>
      </div>
    </form>
  );
}
