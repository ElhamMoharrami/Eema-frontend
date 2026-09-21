/**
 * Centralised, server-side Cala client.
 *
 * Cala API (per https://docs.cala.ai / https://api.cala.ai/openapi.json):
 *   GET https://api.cala.ai/v1/entities?name=...&entity_types=Company
 *     header: X-API-KEY: <key>
 *     → { entities: [{ id, name, entity_type, description }] }
 *   GET https://api.cala.ai/v1/entities/{entity_id}
 *     → { id, name, entity_type, description, properties: {...}, relationships, ... }
 *
 * This module is defensive about everything: missing key, network errors,
 * partial responses, schema drift. It NEVER throws to its caller.
 */

const CALA_BASE = "https://api.cala.ai/v1";

export type VerifiedCompany = {
  name: string;
  industry?: string;
  registration?: string;
  location?: string;
  sourceCount?: number;
};

export type CalaVerifyResult = {
  verified: boolean;
  company?: VerifiedCompany;
};

type CalaProperty = { value: unknown; sources?: unknown[] };
type CalaEntityFull = {
  id?: string;
  name?: string;
  entity_type?: string;
  description?: string | null;
  properties?: Record<string, CalaProperty | undefined>;
  relationships?: unknown;
};
type CalaSearchResp = {
  entities?: Array<{
    id?: string;
    name?: string;
    entity_type?: string;
    description?: string | null;
  }>;
};

const TOTAL_BUDGET_MS = 6000;

export async function verifyCompany(company: string): Promise<CalaVerifyResult> {
  // Defensive: strip whitespace AND any surrounding quotes (Netlify env-var paste hazard)
  const rawKey = process.env.CALA_API_KEY ?? "";
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "").trim();
  if (!apiKey) {
    console.error("[cala] CALA_API_KEY is missing or empty at runtime");
    return { verified: false };
  }
  if (!company.trim()) return { verified: false };

  const ac = new AbortController();
  const stop = setTimeout(() => ac.abort(), TOTAL_BUDGET_MS);

  try {
    const search = await calaGet<CalaSearchResp>(
      `/entities?name=${encodeURIComponent(company.trim())}&entity_types=Company&limit=5`,
      apiKey,
      ac.signal
    );
    const hit = search?.entities?.find((e) => e?.entity_type === "Company" && e.id) ?? null;
    if (!hit?.id) {
      console.error("[cala] no Company match");
      return { verified: false };
    }

    let full: CalaEntityFull | null = null;
    try {
      full = await calaGet<CalaEntityFull>(`/entities/${hit.id}`, apiKey, ac.signal);
    } catch {
      console.error("[cala] retrieve failed");
      // retrieve is optional — fall back to search-only data
    }

    const merged: CalaEntityFull = { ...hit, ...(full ?? {}) };
    return {
      verified: true,
      company: normaliseCompany(merged),
    };
  } catch {
    console.error("[cala] verify failed");
    return { verified: false };
  } finally {
    clearTimeout(stop);
  }
}

async function calaGet<T>(path: string, apiKey: string, signal: AbortSignal): Promise<T> {
  const url = `${CALA_BASE}${path}`;
  const headers: Record<string, string> = {
    "X-API-KEY": apiKey,
    accept: "application/json",
  };

  const tryOnce = async (): Promise<T> => {
    const res = await fetch(url, { headers, signal, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`cala ${res.status}`);
    }
    return (await res.json()) as T;
  };

  try {
    return await tryOnce();
  } catch (e) {
    if (signal.aborted) throw e;
    return await tryOnce();
  }
}

function normaliseCompany(e: CalaEntityFull): VerifiedCompany {
  const name = String(e.name ?? "").trim() || "Unknown company";
  const propVal = (key: string): string | undefined => {
    const v = e.properties?.[key]?.value;
    if (v == null) return undefined;
    if (typeof v === "string") return v.trim() || undefined;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "object") {
      // Some Cala address-like fields arrive as nested objects
      const obj = v as Record<string, unknown>;
      const pretty = [obj.line1, obj.city, obj.region, obj.country]
        .filter((p) => typeof p === "string" && p)
        .join(", ");
      return pretty || JSON.stringify(v).slice(0, 120);
    }
    return undefined;
  };

  const industry = industryFrom(e);
  const registration = propVal("lei") ?? propVal("cik") ?? propVal("legal_name");
  const location = propVal("headquarters_address") ?? propVal("registered_address");

  let sourceCount = 0;
  for (const p of Object.values(e.properties ?? {})) {
    if (p?.sources && Array.isArray(p.sources)) sourceCount += p.sources.length;
  }

  return {
    name,
    industry: industry || undefined,
    registration,
    location,
    sourceCount: sourceCount > 0 ? sourceCount : undefined,
  };
}

function industryFrom(e: CalaEntityFull): string | undefined {
  // Try relationships → OPERATES_IN_INDUSTRY (schema is loose; be defensive)
  const rel = e.relationships as Record<string, unknown> | undefined;
  if (rel && typeof rel === "object") {
    const candidates = [
      (rel as Record<string, unknown>)["OPERATES_IN_INDUSTRY"],
      (rel as Record<string, unknown>)["operates_in_industry"],
      (rel as Record<string, unknown>)["industry"],
    ];
    for (const c of candidates) {
      if (Array.isArray(c) && c.length > 0) {
        const first = c[0] as { name?: string; target?: { name?: string } } | undefined;
        const name = first?.name ?? first?.target?.name;
        if (name) return String(name);
      }
      if (typeof c === "string" && c) return c;
    }
  }
  // Fall back to the entity description (often a one-liner about the business)
  if (e.description) {
    const d = String(e.description).trim();
    if (d) return d.length > 80 ? d.slice(0, 77) + "…" : d;
  }
  return undefined;
}
