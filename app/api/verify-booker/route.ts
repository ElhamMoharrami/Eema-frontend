import { NextRequest, NextResponse } from "next/server";
import { verifyCompany } from "@/lib/cala";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ verified: false }, { status: 200 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)
      || !("company" in body) || typeof body.company !== "string") {
    return NextResponse.json({ verified: false }, { status: 200 });
  }
  const company = body.company.trim();
  if (!company) {
    return NextResponse.json({ verified: false }, { status: 200 });
  }
  const result = await verifyCompany(company);
  return NextResponse.json(result, { status: 200 });
}
