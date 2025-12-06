import { MediaCandidate, WatchCheckResponse } from "./types";
import { appendLog } from "../diagnostics";

type AiAssessment = {
  best_id: string;
  assessment: string;
};

export async function assessMedia(query: string, candidates: MediaCandidate[]): Promise<WatchCheckResponse> {
  const fallbacks = buildFallback(query, candidates);

  if (!process.env.OPENAI_API_KEY) {
    return {
      assessment: fallbacks.assessment,
      match: fallbacks.match,
      alternatives: fallbacks.alternatives,
      source: "fallback",
    };
  }

  try {
    const aiResult = await callOpenAi(query, candidates);
    const best = candidates.find((candidate) => candidate.id === aiResult.best_id) ?? fallbacks.match;

    return {
      assessment: aiResult.assessment || fallbacks.assessment,
      match: best,
      alternatives: candidates.filter((candidate) => candidate.id !== best.id),
      source: "rag",
    };
  } catch (err) {
    console.error("OpenAI assessment failed", err);
    return {
      assessment: `${fallbacks.assessment} (${err instanceof Error ? err.message : "Unknown error"})`,
      match: fallbacks.match,
      alternatives: fallbacks.alternatives,
      source: "fallback",
    };
  }
}

function buildFallback(query: string, candidates: MediaCandidate[]) {
  const fallbackMatch: MediaCandidate =
    candidates.at(0) ?? {
      id: "unknown",
      title: query,
      year: "Unknown",
      kind: "Unknown format",
      artworkUrl: "",
      description: "No metadata found in public sources. Please double-check the title.",
    };

  const base =
    "Could not reach the safety checker. Based on public metadata alone, no soundtrack details were found. If you suspect the soundtrack includes holiday pop hits, use caution or verify the official track list.";

  return {
    match: fallbackMatch,
    assessment: base,
    alternatives: candidates.filter((candidate) => candidate.id !== fallbackMatch.id),
  };
}

async function callOpenAi(query: string, candidates: MediaCandidate[]): Promise<AiAssessment> {
  const challenges = [
    {
      name: "Whamageddon",
      window: "Day after Thanksgiving → Dec 24",
      avoid: ["Last Christmas by Wham!"],
    },
    {
      name: "Little Drummer Boy Challenge",
      window: "Day after Thanksgiving → Dec 24",
      avoid: ["Little Drummer Boy (any recognizable version or sample)"],
    },
  ];

  const context = candidates
    .map((candidate) => {
      const parts = [
        `id: ${candidate.id}`,
        `title: ${candidate.title}`,
        `year: ${candidate.year}`,
        `kind: ${candidate.kind}`,
        candidate.seasonNumber ? `season: ${candidate.seasonNumber}` : null,
        candidate.episodeNumber ? `episode: ${candidate.episodeNumber}` : null,
        `description: ${candidate.description || "No description provided."}`,
      ];
      return parts.filter(Boolean).join(" | ");
    })
    .join("\n");

  const challengeContext = challenges
    .map(
      (c) =>
        `${c.name} (${c.window}): avoid songs -> ${c.avoid.join(
          "; "
        )}. Knocked out if recognized.`
    )
    .join("\n");

  await appendLog("openai", "request", {
    query,
    candidates: candidates.map((c) => ({
      id: c.id,
      title: c.title,
      year: c.year,
      kind: c.kind,
      season: c.seasonNumber,
      episode: c.episodeNumber,
    })),
  });

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      text: {
        format: {
          type: "json_schema",
          name: "watch_check_assessment",
          schema: {
            type: "object",
            required: ["best_id", "assessment"],
            additionalProperties: false,
            properties: {
              best_id: { type: "string", description: "The id of the candidate that best matches the query." },
              assessment: {
                type: "string",
                description:
                  "A concise risk summary of whether watching the media is likely to include challenge songs. Under 90 words.",
              },
            },
          },
        },
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                [
                  "You are providing summaries to players in various holiday challenges to help them avoid being knocked by hearing specific songs.",
                  "Step 1: produce an exhaustive list of all music used in the best-matching title (movie or TV episode): original score cues plus every pop/licensed song used anywhere in scenes. Use search tools to determine what information is available, and use your knowledge as supplementary. Do not guess or approximate—if you cannot verify, state that clearly. If the content is a TV series, use season and episode details to narrow it down",
                  "Step 2: check if any of those songs match the challenge knockout songs provided. Consider exact matches and well-known holiday pop tracks (e.g., 'Last Christmas', 'Little Drummer Boy').",
                  "Step 3: respond playfully: if a knockout song is present, name it and the challenge and warn they’ll be out; otherwise tell them it’s safe to watch. If you cannot verify all music, say so and recommend not watching until verified.",
                  "Use only verifiable details; no speculation. Keep responses under 90 words and bias toward caution when verification is incomplete.",
                  "Use the player's original text together with the candidate metadata to pick the intended title (including season/episode if provided).",
                ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: `User query (player text): ${query}` },
            {
              type: "input_text",
              text: `Candidates (title/year/media):\n${context}\n\nChallenges and knockout songs:\n${challengeContext}\nPick the best candidate id and provide a short, playful assessment per the rules.`,
            },
          ],
        },
      ],
    }),
  });

  const rawBody = await res.text();
  await appendLog("openai", "response", {
    status: res.status,
    statusText: res.statusText,
    body: rawBody.slice(0, 800),
  });

  if (!res.ok) {
    throw new Error(`OpenAI HTTP ${res.status}: ${rawBody.slice(0, 180) || res.statusText}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(rawBody) as unknown;
  } catch (err) {
    throw new Error(`OpenAI JSON parse failed: ${(err as Error).message}`);
  }

  const parsed = extractAssessment(data, candidates);
  if (parsed) return parsed;

  return { best_id: candidates.at(0)?.id ?? "unknown", assessment: "No assessment returned." };
}

function tryParseInlineJson(text: string): AiAssessment | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as AiAssessment;
  } catch {
    return null;
  }
}

function extractAssessment(body: unknown, candidates: MediaCandidate[]): AiAssessment | null {
  const data = (body ?? {}) as Record<string, unknown>;

  const parsedDirect = data.output_parsed as Partial<AiAssessment> | undefined;
  if (parsedDirect?.best_id && parsedDirect.assessment) {
    return { best_id: parsedDirect.best_id, assessment: parsedDirect.assessment };
  }

  const rawOutputText = data.output_text;
  if (typeof rawOutputText === "string") {
    const parsed = tryParseInlineJson(rawOutputText);
    if (parsed?.best_id && parsed.assessment) return parsed;
    return { best_id: candidates.at(0)?.id ?? "unknown", assessment: rawOutputText };
  }

  const outputs = Array.isArray(data.output) ? (data.output as Array<Record<string, unknown>>) : [];
  for (const item of outputs) {
    const contentItems = Array.isArray(item.content) ? (item.content as Array<Record<string, unknown>>) : [];
    if (item?.type !== "message" || contentItems.length === 0) continue;
    for (const content of contentItems) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        const parsed = tryParseInlineJson(content.text);
        if (parsed?.best_id && parsed.assessment) return parsed;
        return { best_id: candidates.at(0)?.id ?? "unknown", assessment: content.text };
      }
      if (content?.type === "json" && content.json) {
        const json = content.json as Partial<AiAssessment>;
        if (json.best_id && json.assessment) {
          return { best_id: json.best_id, assessment: json.assessment };
        }
      }
    }
  }

  return null;
}
