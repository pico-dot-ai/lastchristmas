"use client";

import { type FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import type { WatchCheckResponse } from "@/lib/watch-check/types";

const placeholder =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' fill='%23111'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ccc' font-family='Arial' font-size='16'>No artwork</text></svg>";

type WatchResult = WatchCheckResponse;

export function WatchChecker() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WatchResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => query.trim().length > 1 && status !== "loading", [query, status]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/watch-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || `Request failed with status ${response.status}`);
      }

      const body = (await response.json()) as WatchResult;
      setResult(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to check right now.";
      setError(message);
      setStatus("error");
      return;
    }

    setStatus("idle");
  };

  const artworkUrl = result?.match.artworkUrl || placeholder;

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-950/80 to-black/80 p-6 shadow-xl shadow-slate-900/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-100/80">Safety checker</p>
          <h3 className="text-2xl font-semibold text-white sm:text-3xl">Can I watch this?</h3>
          <p className="text-sm text-slate-200">
            Ask the AI to scan a movie or TV episode for Whamageddon or Little Drummer Boy risk using free metadata and thumbnail sources.
          </p>
        </div>
        <div className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-amber-100/80 shadow-lg shadow-amber-500/10">
          OpenAI-powered check
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="text-xs text-slate-200">Movie, TV series, or episode name</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Love Actually, The Holiday Special"
            className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/70 focus:bg-slate-900"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="shrink-0 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Checking..." : "Submit"}
          </button>
        </div>
        {error && <p className="text-sm text-rose-200">{error}</p>}
      </form>

      {result && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
          <div className="w-full sm:w-auto">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2">
              <Image
                src={artworkUrl}
                alt={result.match.title}
                width={160}
                height={160}
                sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 160px"
                className="h-24 w-24 rounded-lg object-cover sm:h-32 sm:w-32 md:h-40 md:w-40"
              />
            </div>
          </div>
          <div className="w-full flex-1 space-y-3 sm:min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xl font-semibold text-white leading-tight">{result.match.title}</h4>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-100/90">{result.match.year}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">{result.match.kind}</span>
            </div>
            {result.match.description && <p className="text-sm text-slate-200">{result.match.description}</p>}
            {result.match.source && (
              <a
                href={result.match.source}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-amber-100 underline underline-offset-4"
              >
                View source metadata
              </a>
            )}
            {result.alternatives?.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
                <p className="text-[11px] uppercase tracking-[0.18em] text-amber-100/80">Other matches</p>
                <ul className="mt-2 space-y-1">
                  {result.alternatives.map((alt) => (
                    <li key={alt.id} className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{alt.title}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-100">{alt.year}</span>
                      <span className="text-slate-300">{alt.kind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100/80">Assessment</p>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200">
              {result.source === "rag" ? "AI RAG" : "Fallback"}
            </span>
          </div>
          <p className="mt-2 leading-relaxed text-white">{result.assessment}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <Image src="/tmdb.svg" alt="TMDB" width={64} height={18} className="h-4 w-auto" />
          <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-amber-100/90">
          Intelligence by OpenAI
        </span>
      </div>
    </section>
  );
}
