import type { BinaryResponse } from "@/lib/api/client";

export function saveBinaryDownload(response: BinaryResponse, fallbackFilename: string): void {
  const filename = safeDispositionFilename(response.contentDisposition) ?? fallbackFilename;
  const url = URL.createObjectURL(response.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function safeDispositionFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const quoted = disposition.match(/filename="([^"]+)"/i)?.[1];
  const plain = disposition.match(/filename=([^;]+)/i)?.[1]?.trim();
  let candidate = encoded ?? quoted ?? plain;
  if (!candidate) return null;
  try { candidate = decodeURIComponent(candidate); } catch { return null; }
  candidate = candidate.replace(/^['"]|['"]$/g, "");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}\.pdf$/i.test(candidate) || candidate.includes("..")) return null;
  return candidate;
}
