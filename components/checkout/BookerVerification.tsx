"use client";

import { useState } from "react";
import type { CalaVerifyResult } from "@/lib/cala";

type Props = {
  totalLabel: string;
  paying: boolean;
  onConfirm: (company: string | null) => void;
};

type Stage = "ask" | "verifying" | "done";

const EXAMPLE_COMPANY = "LVMH";

export default function BookerVerification({
  totalLabel,
  paying,
  onConfirm,
}: Props) {
  const [company, setCompany] = useState("");
  const [stage, setStage] = useState<Stage>("ask");
  const [result, setResult] = useState<CalaVerifyResult | null>(null);

  const verify = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCompany(trimmed);
    setStage("verifying");
    setResult(null);
    try {
      const res = await fetch("/api/verify-booker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company: trimmed }),
      });
      const data = (await res.json()) as CalaVerifyResult;
      setResult(data);
    } catch {
      setResult({ verified: false });
    } finally {
      setStage("done");
    }
  };

  const reset = () => {
    setStage("ask");
    setResult(null);
  };

  if (stage === "ask") {
    return (
      <div className="settle">
        <div className="label label-ink">Who&apos;s booking?</div>
        <p className="mt-2 text-xs leading-relaxed text-taupe">
          We can verify the company via <span className="label-ochre">Cala</span> to help
          owners understand who is booking. This check is informational only.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify(company);
          }}
          className="mt-4 flex items-center gap-3 border-b border-ink/60 pb-1"
        >
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className="flex-1 bg-transparent text-base font-display text-ink outline-none placeholder:text-ink/35"
            aria-label="Company name"
            autoFocus
          />
          <button
            type="submit"
            disabled={!company.trim()}
            className="label-ochre label hover:text-ochreDeep disabled:opacity-40"
          >
            Verify →
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="label">Try</span>
          <button
            type="button"
            onClick={() => verify(EXAMPLE_COMPANY)}
            className="chip"
          >
            {EXAMPLE_COMPANY}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "verifying") {
    return (
      <div className="settle">
        <div className="label label-ink">Verifying booker</div>
        <p className="mt-3 font-display text-lg italic text-ink/70">
          Verifying booker via Cala…
        </p>
        <p className="mt-1 label-ochre label">{company}</p>
      </div>
    );
  }

  // stage === "done"
  return (
    <div className="settle">
      {result?.verified && result.company ? (
        <VerifiedLine company={result.company} onChange={reset} />
      ) : (
        <UnverifiedLine company={company} onChange={reset} />
      )}

      <button
        type="button"
        onClick={() => onConfirm(result?.verified ? company : company)}
        disabled={paying}
        className="btn btn-ochre mt-6 w-full"
      >
        {paying ? "Opening Mollie…" : `Confirm & pay ${totalLabel}`}
      </button>
    </div>
  );
}

function VerifiedLine({
  company,
  onChange,
}: {
  company: NonNullable<CalaVerifyResult["company"]>;
  onChange: () => void;
}) {
  const tail = [company.registration, company.location]
    .filter((s): s is string => !!s)
    .slice(0, 1)
    .join("");

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="available-mark">Verified via Cala</span>
        <button type="button" onClick={onChange} className="label hover:text-ink">
          Change
        </button>
      </div>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-ink">
        <span className="text-ochre">✓</span>{" "}
        <span className="font-display text-lg">{company.name}</span>
        {company.industry && (
          <>
            {" · "}
            <span className="text-ink/80">{company.industry}</span>
          </>
        )}
      </p>
      {tail && (
        <p className="mt-1 tabular font-mono text-xs text-taupe">{tail}</p>
      )}
      {company.sourceCount != null && (
        <p className="mt-1 label">
          {company.sourceCount} source{company.sourceCount === 1 ? "" : "s"} · Cala
        </p>
      )}
      <span className="rule mt-4" aria-hidden />
    </div>
  );
}

function UnverifiedLine({
  company,
  onChange,
}: {
  company: string;
  onChange: () => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="label label-ink">Manual review</span>
        <button type="button" onClick={onChange} className="label hover:text-ink">
          Change
        </button>
      </div>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/85">
        Couldn&apos;t verify <span className="font-display text-lg">{company}</span>{" "}
        automatically — flagged for manual review.
      </p>
      <span className="rule mt-4" aria-hidden />
    </div>
  );
}
