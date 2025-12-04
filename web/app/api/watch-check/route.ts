import { NextResponse } from "next/server";
import { findCandidates } from "@/lib/watch-check/search";
import { assessMedia } from "@/lib/watch-check/assess";

export const runtime = "nodejs";

// Do not change this endpoint without explicit approval.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { query?: string };
    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const candidates = await findCandidates(query);
    const assessment = await assessMedia(query, candidates);

    return NextResponse.json(assessment);
  } catch (err) {
    console.error("watch-check error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
