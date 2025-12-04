import { MediaCandidate } from "./types";
import { searchTmdb } from "./tmdb";

type ItunesResult = {
  trackId?: number;
  collectionId?: number;
  trackName?: string;
  collectionName?: string;
  releaseDate?: string;
  kind?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  primaryGenreName?: string;
  trackViewUrl?: string;
  collectionViewUrl?: string;
  wrapperType?: string;
};

export async function findCandidates(query: string): Promise<MediaCandidate[]> {
  // Prefer TMDB for richer metadata; fall back to iTunes if needed.
  const tmdbResults = await searchTmdb(query);
  if (tmdbResults.length > 0) return tmdbResults.slice(0, 8);

  const normalizedQuery = query.toLowerCase();
  const [movieResults, tvResults] = await Promise.all([searchItunes(query, "movie"), searchItunes(query, "tvShow")]);
  const combined = [...movieResults, ...tvResults];

  const scored = combined
    .map((item) => ({ item, score: scoreResult(item, normalizedQuery) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8); // keep a small, relevant pool for RAG

  return scored.map(({ item }, index) => toCandidate(item, query, index));
}

async function searchItunes(term: string, media: "movie" | "tvShow") {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", term);
  url.searchParams.set("media", media);
  url.searchParams.set("limit", "10");

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    console.warn("iTunes search failed", { media, status: res.status });
    return [] as ItunesResult[];
  }
  const data = (await res.json()) as { results: ItunesResult[] };
  return data.results || [];
}

function scoreResult(item: ItunesResult, normalizedQuery: string) {
  const haystack = [item.trackName, item.collectionName, item.primaryGenreName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  let score = 0;
  if (haystack.includes(normalizedQuery)) score += 6;
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (terms.every((term) => haystack.includes(term))) score += 3;
  if ((item.kind || "").includes("movie")) score += 1.5;
  if ((item.kind || "").includes("tv-episode")) score += 1.5;
  if (item.releaseDate) score += 0.5;
  return score;
}

function labelKind(item: ItunesResult) {
  if (item.kind === "feature-movie") return "Movie";
  if (item.kind === "tv-episode") return "TV episode";
  if (item.wrapperType === "collection") return "TV season";
  return "Media";
}

function toCandidate(item: ItunesResult, query: string, index: number): MediaCandidate {
  const artwork = item.artworkUrl100 || item.artworkUrl60 || "";
  return {
    id: (item.trackId?.toString() || item.collectionId?.toString() || `candidate-${index}`) as string,
    title: item.trackName || item.collectionName || query,
    year: item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : "Unknown",
    kind: labelKind(item),
    // Fetch a mid-size thumbnail for display instead of a large poster
    artworkUrl: artwork ? artwork.replace("100x100bb", "200x200bb") : "",
    description: item.longDescription || item.description || item.shortDescription,
    source: item.trackViewUrl || item.collectionViewUrl,
  };
}
